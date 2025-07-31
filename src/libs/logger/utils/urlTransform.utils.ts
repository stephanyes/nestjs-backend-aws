import { IncomingMessage } from 'http';
import * as tls from 'tls';
class UrlTransformUtils extends URL {
  static fromRequest(request: IncomingMessage) {
    const { url, headers } = request;
    if (!url) {
      return { searchParams: new URLSearchParams(), origin: '', pathname: '' };
    }
    if (!headers.host) {
      return new UrlTransformUtils(url);
    }
    const protocol =
      request.socket instanceof tls.TLSSocket &&
      request.socket.getPeerCertificate()
        ? 'https'
        : 'http';
    const urlBase = `${protocol}://${headers.host}`;
    return new UrlTransformUtils(url, urlBase);
  }
}
export { UrlTransformUtils };
