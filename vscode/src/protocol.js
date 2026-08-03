export const PROTOCOL_VERSION = 1;

export const MESSAGE_TYPES = {
  READY: 'ready',
  REQUEST_REFRESH: 'requestRefresh',
  REQUEST_SCREENSHOT: 'requestScreenshot',
  OPERATION_RESULT: 'operationResult',
};

export function validateInboundMessage(message) {
  if (!message || typeof message !== 'object') {
    return false;
  }
  if (message.protocol !== PROTOCOL_VERSION) {
    return false;
  }
  if (typeof message.type !== 'string') {
    return false;
  }
  if (typeof message.revision !== 'number') {
    return false;
  }

  switch (message.type) {
    case MESSAGE_TYPES.READY:
      return typeof message.tocCount === 'number';
    case MESSAGE_TYPES.REQUEST_REFRESH:
    case MESSAGE_TYPES.REQUEST_SCREENSHOT:
      return typeof message.requestId === 'string' || typeof message.requestId === 'number';
    default:
      return false;
  }
}
