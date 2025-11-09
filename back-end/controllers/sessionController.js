const Mentee = require('../models/Mentee');

//Award badges based on completed sessions
async function awardBadges(menteeId) {
  const mentee = await Mentee.findById(menteeId);
  if (!mentee) return;

  const thresholds = [1, 5, 10, 20];
  const titles = ['Starter', '5 Sessions', '10 Sessions', 'Consistency Master'];

  thresholds.forEach((t, idx) => {
    if (mentee.completedSessions >= t) {
      const existing = mentee.earnedBadges.find(
  b => b.title.toLowerCase() === titles[idx].toLowerCase()
);

      if (!existing) {
        mentee.earnedBadges.push({ id: String(idx + 1), title: titles[idx], earned: true });
      }
    }
  });

  await mentee.save();
}

module.exports = { awardBadges };
