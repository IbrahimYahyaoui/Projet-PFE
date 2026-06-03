// backend/jobs/escalationJob.js
// Runs every 30 min. Finds stale tickets and escalates them.
const Ticket = require('../schemas/ticket');
const Team   = require('../schemas/team');
const User   = require('../schemas/user');
const { createNotification } = require('../utils/notifications');

const SYSTEM_USER_ID = '000000000000000000000000'; // sentinel for system-triggered events

const SLA_HOURS = { critical: 4, high: 24, medium: 72, low: 168 };

module.exports = async function runEscalationJob() {
  try {
    const now = new Date();

    // ── 1. SLA breach: tickets past their deadline, not resolved ──
    const breachedTickets = await Ticket.find({
      slaDeadline: { $lt: now },
      slaBreached: false,
      status: { $nin: ['resolved', 'closed'] },
    }).populate('assignedTo', 'name').populate('teamId');

    for (const ticket of breachedTickets) {
      await Ticket.findByIdAndUpdate(ticket._id, { slaBreached: true });

      const admins = await User.find({ role: 'admin' }).select('_id');
      const team   = ticket.teamId ? await Team.findById(ticket.teamId) : null;

      const recipients = [
        ...(admins.map(a => a._id.toString())),
        team?.leaderId?.toString(),
        ticket.assignedTo?._id?.toString(),
      ].filter(Boolean);

      await Promise.all(recipients.map(uid =>
        createNotification({
          userId: uid,
          type: 'sla_breached',
          message: `SLA dépassé : ticket "${ticket.title}" (${ticket.priority})`,
          triggeredBy: admins[0]?._id ?? ticket.createdBy,
          ticketId: ticket._id,
        })
      ));
    }

    // ── 2. Escalation: open tickets without a team for > 2 hours ──
    const unroutedTickets = await Ticket.find({
      status: 'open',
      teamId: null,
      escalationLevel: 0,
      createdAt: { $lt: new Date(now - 2 * 3600000) },
    });

    for (const ticket of unroutedTickets) {
      await Ticket.findByIdAndUpdate(ticket._id, {
        escalationLevel: 1,
        escalatedAt: now,
      });

      const admins = await User.find({ role: 'admin' }).select('_id');
      await Promise.all(admins.map(a =>
        createNotification({
          userId: a._id,
          type: 'escalated',
          message: `Ticket non assigné à une équipe depuis 2h : "${ticket.title}"`,
          triggeredBy: a._id,
          ticketId: ticket._id,
        })
      ));
    }

    // ── 3. Escalation: assigned tickets with no progress for > 4 hours ──
    const staleTechTickets = await Ticket.find({
      status: 'assigned',
      escalationLevel: { $lt: 2 },
      updatedAt: { $lt: new Date(now - 4 * 3600000) },
    }).populate('teamId');

    for (const ticket of staleTechTickets) {
      await Ticket.findByIdAndUpdate(ticket._id, {
        escalationLevel: Math.min(ticket.escalationLevel + 1, 2),
        escalatedAt: now,
      });

      const team = ticket.teamId ? await Team.findById(ticket.teamId) : null;
      const admins = await User.find({ role: 'admin' }).select('_id');

      const recipients = [
        team?.leaderId?.toString(),
        ...(admins.map(a => a._id.toString())),
      ].filter(Boolean);

      await Promise.all(recipients.map(uid =>
        createNotification({
          userId: uid,
          type: 'escalated',
          message: `Ticket sans progression depuis 4h : "${ticket.title}"`,
          triggeredBy: admins[0]?._id ?? ticket.createdBy,
          ticketId: ticket._id,
        })
      ));
    }

    if (breachedTickets.length || unroutedTickets.length || staleTechTickets.length) {
      console.log(`[Escalation] SLA breached: ${breachedTickets.length}, Unrouted: ${unroutedTickets.length}, Stale: ${staleTechTickets.length}`);
    }
  } catch (err) {
    console.error('[Escalation job error]', err.message);
  }
};
