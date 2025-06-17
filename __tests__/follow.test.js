import { sendFollowRequest, cancelFollowRequest, checkFollowStatus } from '../js/follow.js';
import { jest } from '@jest/globals';

test('sendFollowRequest inserts into follow_requests', async () => {
  const insert = jest.fn();
  const supabase = { from: jest.fn(() => ({ insert })) };
  await sendFollowRequest(supabase, 'u1', 'u2');
  expect(supabase.from).toHaveBeenCalledWith('follow_requests');
  expect(insert).toHaveBeenCalledWith({ requester_id: 'u1', target_id: 'u2' });
});

test('cancelFollowRequest deletes pending request', async () => {
  const api = { delete: jest.fn(() => api), eq: jest.fn(() => api) };
  const supabase = { from: jest.fn(() => api) };
  await cancelFollowRequest(supabase, 'u1', 'u2');
  expect(supabase.from).toHaveBeenCalledWith('follow_requests');
  expect(api.delete).toHaveBeenCalled();
  expect(api.eq).toHaveBeenNthCalledWith(1, 'requester_id', 'u1');
  expect(api.eq).toHaveBeenNthCalledWith(2, 'target_id', 'u2');
});

test('checkFollowStatus queries follows then requests', async () => {
  const followApi = {
    select: jest.fn(() => followApi),
    eq: jest.fn(() => followApi),
    single: jest.fn().mockResolvedValue({ data: null }),
  };
  const requestApi = {
    select: jest.fn(() => requestApi),
    eq: jest.fn(() => requestApi),
    single: jest.fn().mockResolvedValue({ data: { id: 1 } }),
  };
  const supabase = {
    from: jest.fn((table) => (table === 'follows' ? followApi : requestApi)),
  };
  const result = await checkFollowStatus(supabase, 'u1', 'u2');
  expect(supabase.from).toHaveBeenCalledWith('follows');
  expect(followApi.select).toHaveBeenCalledWith('*');
  expect(followApi.eq).toHaveBeenNthCalledWith(1, 'follower_id', 'u1');
  expect(followApi.eq).toHaveBeenNthCalledWith(2, 'following_id', 'u2');
  expect(requestApi.eq).toHaveBeenNthCalledWith(1, 'requester_id', 'u1');
  expect(requestApi.eq).toHaveBeenNthCalledWith(2, 'target_id', 'u2');
  expect(result).toEqual({ isFollowing: false, isRequested: true });
});
