// 방 상태 직렬화 — HTTP 폴링 라우트와 웹소켓 브로드캐스트가 함께 쓴다.
import { isTeamGame, classicRoundType, classicChainIndex } from './store';

const remainSec = (endsAt) => Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));

// 플레이어별로 공개 범위가 다르므로 항상 playerId 기준으로 만든다.
export function buildState(room, playerId) {
  const you = room.players.find((p) => p.id === playerId) ?? null;

  const state: Record<string, any> = {
    code: room.code,
    name: room.name,
    isPublic: room.isPublic,
    status: room.status,
    mode: room.mode,
    options: room.options,
    teamGame: isTeamGame(room),
    players: room.players.map((p) => ({ nickname: p.nickname, isHost: p.isHost, team: p.team, score: p.score })),
    you: you ? { nickname: you.nickname, isHost: you.isHost, team: you.team, score: you.score } : null,
  };

  if (room.status === 'playing' && you) state.game = buildGameView(room, you);
  if (room.status === 'finished') state.results = buildResults(room, you);
  return state;
}

function buildGameView(room, you) {
  const g = room.game;
  switch (room.mode) {
    case 'classic': {
      const type = classicRoundType(g.round);
      const sub = g.submissions.get(you.id) ?? null;
      const j = classicChainIndex(room, you.id);
      const chain = g.chains[j] ?? [];
      const prev = chain[chain.length - 1] ?? null;
      let task;
      if (g.round === 0) task = { kind: 'phrase' };
      else if (type === 'image') task = { kind: 'draw', sourceText: prev?.text ?? null };
      else task = { kind: 'guess', sourceImage: prev?.url ?? null };
      return {
        kind: 'classic',
        round: g.round + 1,
        total: g.totalRounds,
        remaining: remainSec(g.endsAt),
        task,
        submitted: !!sub?.submitted,
        draft: sub ? { text: sub.text ?? null, prompt: sub.prompt ?? null, url: sub.url ?? null } : null,
        players: room.players.map((p) => ({ nickname: p.nickname, submitted: !!g.submissions.get(p.id)?.submitted })),
      };
    }

    case 'speed': {
      const isDrawer = g.drawerId === you.id;
      const drawer = room.players.find((p) => p.id === g.drawerId);
      const reveal = g.phase === 'reveal';
      return {
        kind: 'speed',
        round: g.round + 1,
        total: g.totalRounds,
        phase: g.phase,
        remaining: remainSec(g.endsAt),
        teamMode: room.options.teamMode,
        drawer: drawer?.nickname ?? '?',
        youAreDrawer: isDrawer,
        keyword: isDrawer || reveal ? g.keyword : null,
        image: g.phase === 'guess' ? g.image : reveal ? g.image ?? g.draftUrl : null,
        draft: isDrawer ? { prompt: g.draftPrompt, url: g.draftUrl } : null,
        guesses: g.guesses.slice(-12).map((x) => ({
          nickname: x.nickname,
          text: x.correct && !reveal ? null : x.text, // 정답 텍스트는 공개 전 마스킹
          correct: x.correct,
        })),
        winner: reveal ? (room.players.find((p) => p.id === g.winnerId)?.nickname ?? null) : null,
        teamScores: room.options.teamMode ? g.teamScores : null,
      };
    }

    case 'speed_team': {
      const t = you.team;
      const reveal = g.phase === 'reveal';
      const youAreDrawer = g.drawers[t] === you.id;
      return {
        kind: 'speed_team',
        round: g.round + 1,
        total: g.totalRounds,
        phase: g.phase,
        remaining: remainSec(g.endsAt),
        yourTeam: t,
        youAreDrawer,
        keyword: youAreDrawer || reveal ? g.keyword : null,
        teams: [0, 1].map((ti) => ({
          drawer: room.players.find((p) => p.id === g.drawers[ti])?.nickname ?? '?',
          imageReady: !!g.teams[ti].image,
          // 자기 팀 그림만 보이고, 상대 팀 그림은 결과 공개 때만
          image: ti === t || reveal ? g.teams[ti].image : null,
        })),
        draft: youAreDrawer ? { prompt: g.teams[t].draftPrompt, url: g.teams[t].draftUrl } : null,
        guesses: g.guesses
          .filter((x) => reveal || x.team === t)
          .slice(-12)
          .map((x) => ({ nickname: x.nickname, team: x.team, text: x.correct && !reveal ? null : x.text, correct: x.correct })),
        winnerTeam: reveal ? g.winnerTeam : null,
        winner: reveal ? (room.players.find((p) => p.id === g.winnerId)?.nickname ?? null) : null,
        teamScores: g.teamScores,
      };
    }

    case 'relay': {
      const yourGroup = isTeamGame(room) ? you.team : 0;
      return {
        kind: 'relay',
        theme: g.theme,
        teamMode: isTeamGame(room),
        yourGroup,
        groups: g.groups.map((group, gi) => {
          const curId = group.done ? null : group.order[group.turn];
          const youAreCurrent = curId === you.id;
          return {
            team: isTeamGame(room) ? gi : null,
            done: group.done,
            turn: group.turn + 1,
            totalTurns: group.order.length,
            turnNickname: curId ? room.players.find((p) => p.id === curId)?.nickname ?? '?' : null,
            remaining: group.done ? 0 : remainSec(group.endsAt),
            currentImage: [...group.entries].reverse().find((e) => e.url)?.url ?? null,
            // 진행 중에는 남의 프롬프트를 감춘다 (결과 화면에서 공개)
            entries: group.entries.map((e) => ({
              nickname: e.nickname,
              prompt: e.playerId === you.id ? e.prompt : null,
              url: e.url,
              skipped: e.skipped,
            })),
            youAreCurrent,
            draft: youAreCurrent ? { prompt: group.draftPrompt, url: group.draftUrl } : null,
          };
        }),
      };
    }

    case 'coop': {
      const sub = g.subs.get(you.id) ?? null;
      return {
        kind: 'coop',
        theme: g.theme,
        teamMode: isTeamGame(room),
        remaining: remainSec(g.endsAt),
        you: {
          submitted: !!sub?.submitted,
          draft: sub ? { prompt: sub.prompt ?? null, url: sub.url ?? null } : null,
        },
        groups: g.groups.map((group, gi) => ({
          team: isTeamGame(room) ? gi : null,
          cols: group.cols,
          cells: group.members.map((id) => {
            const p = room.players.find((x) => x.id === id);
            const s = g.subs.get(id);
            return { nickname: p?.nickname ?? '?', submitted: !!s?.submitted, url: s?.submitted ? s.url : null, you: id === you.id };
          }),
        })),
      };
    }

    case 'imposter': {
      const youAreImposter = g.imposterId === you.id;
      const youAreModerator = g.moderatorId === you.id;
      const curId = g.phase === 'turns' ? g.order[g.turn] : null;
      return {
        kind: 'imposter',
        phase: g.phase,
        remaining: remainSec(g.endsAt),
        imposter: room.players.find((p) => p.id === g.imposterId)?.nickname ?? '?',
        youAreImposter,
        youAreModerator,
        moderator: g.moderatorId ? room.players.find((p) => p.id === g.moderatorId)?.nickname ?? null : null,
        keyword: youAreImposter ? null : g.keyword,
        order: g.order.map((id) => room.players.find((p) => p.id === id)?.nickname ?? '?'),
        turnIndex: g.turn,
        turnNickname: curId ? room.players.find((p) => p.id === curId)?.nickname ?? '?' : null,
        youAreCurrent: curId === you.id,
        entries: g.entries.map((e) => ({ nickname: e.nickname, url: e.url, skipped: e.skipped })),
        draft: curId === you.id ? { prompt: g.draftPrompt, url: g.draftUrl } : null,
      };
    }
  }
  return null;
}

function buildResults(room, you) {
  const g = room.game;
  if (!g) return null;
  switch (room.mode) {
    case 'classic':
      return {
        kind: 'classic',
        albums: g.chains.map((chain, j) => ({
          owner: room.players.find((p) => p.id === g.order[j])?.nickname ?? '?',
          entries: chain.map((e) => ({ type: e.type, text: e.text, prompt: e.prompt, url: e.url, author: e.authorNickname })),
        })),
      };
    case 'speed':
      return {
        kind: 'speed',
        teamMode: room.options.teamMode,
        teamScores: room.options.teamMode ? g.teamScores : null,
        scores: room.players
          .map((p) => ({ nickname: p.nickname, score: p.score, team: p.team }))
          .sort((a, b) => b.score - a.score),
        history: g.history,
      };
    case 'speed_team':
      return {
        kind: 'speed_team',
        teamScores: g.teamScores,
        history: g.history,
      };
    case 'relay':
      return {
        kind: 'relay',
        theme: g.theme,
        scored: room.options.scored,
        teamMode: isTeamGame(room),
        groups: g.groups.map((group, gi) => ({
          team: isTeamGame(room) ? gi : null,
          score: group.score,
          finalImage: [...group.entries].reverse().find((e) => e.url)?.url ?? null,
          entries: group.entries.map((e) => ({ nickname: e.nickname, prompt: e.prompt, url: e.url, skipped: e.skipped })),
        })),
      };
    case 'coop':
      return {
        kind: 'coop',
        theme: g.theme,
        scored: room.options.scored,
        teamMode: isTeamGame(room),
        groups: g.groups.map((group, gi) => ({
          team: isTeamGame(room) ? gi : null,
          score: group.score,
          cols: group.cols,
          cells: group.members.map((id) => {
            const p = room.players.find((x) => x.id === id);
            const s = g.subs.get(id);
            return { nickname: p?.nickname ?? '?', url: s?.url ?? null, prompt: s?.prompt ?? null };
          }),
        })),
      };
    case 'imposter':
      return {
        kind: 'imposter',
        keyword: g.keyword,
        imposter: room.players.find((p) => p.id === g.imposterId)?.nickname ?? '?',
        guess: g.guess,
        won: g.won,
        entries: g.entries.map((e) => ({ nickname: e.nickname, url: e.url, prompt: e.prompt, skipped: e.skipped })),
      };
  }
  return null;
}
