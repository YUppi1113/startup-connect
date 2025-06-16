import { composeMessage } from '../js/message.js';

test('composeMessage creates trimmed message object', () => {
  const msg = composeMessage(1, 2, ' hello ');
  expect(msg).toEqual({
    sender_id: 1,
    receiver_id: 2,
    content: 'hello',
    file_url: null,
    is_read: false
  });
});

 test('composeMessage requires ids', () => {
  expect(() => composeMessage(null, 2, 'hi')).toThrow();
});
