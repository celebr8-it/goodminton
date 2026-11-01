import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesFilters } from './matchFilters.js';

const teams = new Map([
    ['a', { name: 'Smashers', team_members: [{ players: { full_name: 'Ravi Kumar' } }] }],
    ['b', { name: 'Shuttlers', team_members: [{ player: { full_name: 'Sahith Rao' } }] }],
    ['c', { name: 'Aces', team_members: [] }]
]);
const pending = { team_a_id: 'a', team_b_id: 'b' };
const played = { ...pending, winner_team_id: 'b' };
const includes = (match, filters = {}, label = 'League · Match 12', teamMap = teams) =>
    matchesFilters(match, { query: '', teamId: '', status: '', ...filters }, teamMap, label);

test('search finds full player names across both join shapes and both teams', () => {
    assert.equal(includes(pending, { query: '  KUMAR   sahith ' }), true);
    assert.equal(includes(pending, { query: 'Ravi Aces' }), false);
});

test('search finds team names, match numbers and playoff rounds', () => {
    assert.equal(includes(pending, { query: 'Smashers Shuttlers' }), true);
    assert.equal(includes(pending, { query: 'match 12' }), true);
    assert.equal(includes(pending, { query: 'Semi-final 1' }, 'Semi-final 1'), true);
});

test('team filter accepts either side and combines with search', () => {
    assert.equal(includes(pending, { teamId: 'a' }), true);
    assert.equal(includes(pending, { teamId: 'b', query: 'Ravi' }), true);
    assert.equal(includes(pending, { teamId: 'c' }), false);
    assert.equal(includes(pending, { teamId: 'a', query: 'Unknown' }), false);
});

test('score status uses the same winner-based distinction as the match lists', () => {
    assert.equal(includes(pending, { status: 'pending' }), true);
    assert.equal(includes(played, { status: 'pending' }), false);
    assert.equal(includes(pending, { status: 'played' }), false);
    assert.equal(includes(played, { status: 'played' }), true);
    assert.equal(includes(played), true);
});

test('search falls back to embedded teams and tolerates missing teams', () => {
    assert.equal(includes({ team_a: teams.get('a') }, { query: 'Kumar' }, '', new Map()), true);
    assert.equal(includes({}, { query: 'Ravi' }), false);
    assert.equal(includes({}), true);
});
