#!/usr/bin/env node
/**
 * 生成 2026 世界杯小组赛对阵数据
 *
 * 12 groups × 4 teams = 48 teams
 * Each group: 6 matches (round-robin)
 * Total: 72 matches
 *
 * Group stage: June 11 - June 26, 2026 (16 days)
 * ~4-5 matches per day
 */

const GROUPS = [
  { group: "A", teams: ["Mexico", "Canada", "USA", "New Zealand"] },
  { group: "B", teams: ["Portugal", "Italy", "Morocco", "Iran"] },
  { group: "C", teams: ["France", "Netherlands", "Senegal", "Ecuador"] },
  { group: "D", teams: ["Brazil", "Croatia", "Nigeria", "Australia"] },
  { group: "E", teams: ["England", "Denmark", "Algeria", "South Korea"] },
  { group: "F", teams: ["Argentina", "Uruguay", "Ghana", "Saudi Arabia"] },
  { group: "G", teams: ["Spain", "Switzerland", "Egypt", "Japan"] },
  { group: "H", teams: ["Germany", "Belgium", "Cameroon", "Paraguay"] },
  { group: "I", teams: ["Colombia", "Sweden", "Tunisia", "Qatar"] },
  { group: "J", teams: ["Serbia", "Poland", "Ivory Coast", "Jamaica"] },
  { group: "K", teams: ["Peru", "South Africa", "Chile", "Panama"] },
  { group: "L", teams: ["Norway", "Venezuela", "Costa Rica", "Honduras"] },
];

// Matchup pairs for 4-team round-robin (6 matches)
function roundRobinPairs(teams) {
  const pairs = [];
  for (let i = 0; i < teams.length; i++) {
    for (let j = i + 1; j < teams.length; j++) {
      pairs.push([teams[i], teams[j]]);
    }
  }
  return pairs;
}

// Match days schedule (June 11 - June 26, 2026)
// Each day slot has 4-5 matches across different groups
const MATCH_DAYS = [
  "2026-06-11", "2026-06-12", "2026-06-13", "2026-06-14",
  "2026-06-15", "2026-06-16", "2026-06-17", "2026-06-18",
  "2026-06-19", "2026-06-20", "2026-06-21", "2026-06-22",
  "2026-06-23", "2026-06-24", "2026-06-25", "2026-06-26",
];

function generateSchedule() {
  const result = {};
  let matchId = 1;

  // For each group, assign the 6 matches across different days
  // We'll rotate through match days to spread them out
  for (const g of GROUPS) {
    const pairs = roundRobinPairs(g.teams);
    const matches = [];

    for (let mi = 0; mi < pairs.length; mi++) {
      const dayIndex = (matchId - 1) % MATCH_DAYS.length;
      const [team1, team2] = pairs[mi];
      
      matches.push({
        id: matchId,
        date: MATCH_DAYS[dayIndex],
        team1,
        team2,
        score1: null,
        score2: null,
        status: "upcoming", // upcoming | live | finished
      });
      matchId++;
    }

    result[g.group] = {
      teams: g.teams,
      matches,
    };
  }

  return result;
}

// Generate and output as JSON
const data = {
  updated: new Date().toISOString().split("T")[0],
  groups: generateSchedule(),
};

// Also calculate a simple standings function for each group
function computeStandings(groupData) {
  const standings = {};
  for (const team of groupData.teams) {
    standings[team] = { pts: 0, gp: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0 };
  }
  for (const m of groupData.matches) {
    if (m.status !== "finished" || m.score1 === null) continue;
    const t1 = m.team1, t2 = m.team2;
    standings[t1].gp++;
    standings[t2].gp++;
    standings[t1].gf += m.score1;
    standings[t1].ga += m.score2;
    standings[t2].gf += m.score2;
    standings[t2].ga += m.score1;
    if (m.score1 > m.score2) {
      standings[t1].w++;
      standings[t1].pts += 3;
      standings[t2].l++;
    } else if (m.score1 < m.score2) {
      standings[t2].w++;
      standings[t2].pts += 3;
      standings[t1].l++;
    } else {
      standings[t1].d++;
      standings[t2].d++;
      standings[t1].pts++;
      standings[t2].pts++;
    }
  }
  return standings;
}

data.computeStandings = computeStandings.toString();

// Output as JavaScript variable declaration
console.log("var GROUP_MATCHES = " + JSON.stringify(data, null, 2) + ";");
