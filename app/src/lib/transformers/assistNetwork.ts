import type { PbpAction, AssistGraph, AssistNode, AssistLink } from '@/types/nba';

/**
 * Parse PBP V3 actions to build assist network graphs per team.
 *
 * Made FG descriptions contain assists in format:
 * "Towns 15' Fadeaway Jumper (2 PTS) (Edwards 1 AST)"
 *
 * We extract scorer (playerName) and assister from description.
 */
export function transformAssistNetwork(
  actions: PbpAction[],
  homeTeamId: number,
  awayTeamId: number
): { home: AssistGraph; away: AssistGraph } {
  const assistRegex = /\((\w[\w'.čćžšđ-]*(?:\s\w[\w'.čćžšđ-]*)*)\s+\d+\s+AST\)/;

  const links: { scorer: string; assister: string; teamId: number }[] = [];

  for (const action of actions) {
    if (action.isFieldGoal !== 1 || action.shotResult !== 'Made') continue;

    const match = action.description.match(assistRegex);
    if (!match) continue;

    const assisterLastName = match[1];
    const scorerLastName = action.playerName;
    const teamId = action.teamId;

    links.push({ scorer: scorerLastName, assister: assisterLastName, teamId });
  }

  function buildGraph(teamId: number): AssistGraph {
    const teamLinks = links.filter((l) => l.teamId === teamId);

    // Count link frequencies
    const linkMap = new Map<string, number>();
    const assistCounts = new Map<string, number>();
    const allPlayers = new Set<string>();

    for (const { scorer, assister } of teamLinks) {
      const key = `${assister}->${scorer}`;
      linkMap.set(key, (linkMap.get(key) ?? 0) + 1);
      assistCounts.set(assister, (assistCounts.get(assister) ?? 0) + 1);
      allPlayers.add(scorer);
      allPlayers.add(assister);
    }

    const nodes: AssistNode[] = Array.from(allPlayers).map((name) => ({
      id: name,
      assists: assistCounts.get(name) ?? 0,
      teamId,
    }));

    const graphLinks: AssistLink[] = Array.from(linkMap.entries()).map(
      ([key, value]) => {
        const [source, target] = key.split('->');
        return { source, target, value };
      }
    );

    return { nodes, links: graphLinks };
  }

  return {
    home: buildGraph(homeTeamId),
    away: buildGraph(awayTeamId),
  };
}
