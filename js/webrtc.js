// Simple WebRTC manager using Supabase realtime channels
export class WebRTCManager {
  constructor(supabase) {
    this.supabase = supabase;
    this.currentUser = null;
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    this.channel = null;
    this.remoteId = null;
    this.callType = 'video';
    this.pendingOffer = null;
    this.onIncoming = null;
    this.onEnded = null;
  }

  async init(currentUser) {
    this.currentUser = currentUser;
  }

  async subscribe(remoteId) {
    if (!this.currentUser) return;
    const ids = [this.currentUser.id, remoteId].sort();
    const name = `webrtc-${ids[0]}-${ids[1]}`;
    if (this.channel && this.channel.topic === name) return;
    if (this.channel) await this.channel.unsubscribe();
    this.channel = this.supabase.channel(name);
    this.channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      if (payload.to !== this.currentUser.id) return;
      this.#handleSignal(payload);
    });
    await this.channel.subscribe();
  }

  async startCall(remoteId, type = 'video') {
    this.remoteId = remoteId;
    this.callType = type;
    await this.subscribe(remoteId);
    await this.#setupLocalStream(type);
    this.#createPeer();
    this.localStream.getTracks().forEach((t) => this.peer.addTrack(t, this.localStream));
    const offer = await this.peer.createOffer();
    await this.peer.setLocalDescription(offer);
    this.#send('offer', this.peer.localDescription);
  }

  async acceptOffer() {
    if (!this.pendingOffer) return;
    const { from, signal } = this.pendingOffer;
    this.remoteId = from;
    await this.subscribe(from);
    await this.#setupLocalStream(signal.callType);
    this.#createPeer();
    await this.peer.setRemoteDescription(new RTCSessionDescription(signal.data));
    this.localStream.getTracks().forEach((t) => this.peer.addTrack(t, this.localStream));
    const answer = await this.peer.createAnswer();
    await this.peer.setLocalDescription(answer);
    this.#send('answer', this.peer.localDescription);
    this.pendingOffer = null;
  }

  rejectOffer() {
    if (!this.pendingOffer) return;
    this.remoteId = this.pendingOffer.from;
    this.#send('reject', {});
    this.pendingOffer = null;
  }

  endCall() {
    if (this.peer) this.peer.close();
    if (this.localStream) {
      this.localStream.getTracks().forEach((t) => t.stop());
    }
    const lv = document.getElementById('local-video');
    const rv = document.getElementById('remote-video');
    if (lv) lv.srcObject = null;
    if (rv) rv.srcObject = null;
    this.peer = null;
    this.localStream = null;
    this.remoteStream = null;
    if (this.remoteId) this.#send('end', {});
    if (this.onEnded) this.onEnded();
  }

  #createPeer() {
    if (this.peer) return;
    this.peer = new RTCPeerConnection({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
    });
    this.peer.onicecandidate = (e) => {
      if (e.candidate) this.#send('candidate', e.candidate);
    };
    this.peer.ontrack = (e) => {
      if (!this.remoteStream) {
        this.remoteStream = new MediaStream();
        const rv = document.getElementById('remote-video');
        if (rv) rv.srcObject = this.remoteStream;
      }
      this.remoteStream.addTrack(e.track);
    };
  }

  async #setupLocalStream(type) {
    const constraints = type === 'video' ? { video: true, audio: true } : { audio: true };
    this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
    const lv = document.getElementById('local-video');
    if (lv) {
      lv.srcObject = this.localStream;
      lv.muted = true;
    }
  }

  #send(eventType, data) {
    if (!this.channel || !this.remoteId) return;
    this.channel.send({
      type: 'broadcast',
      event: 'signal',
      payload: {
        from: this.currentUser.id,
        to: this.remoteId,
        signal: { type: eventType, data, callType: this.callType },
      },
    });
  }

  async #handleSignal(payload) {
    const { signal, from } = payload;
    switch (signal.type) {
      case 'offer':
        this.pendingOffer = payload;
        if (this.onIncoming) this.onIncoming(from, signal.callType);
        break;
      case 'answer':
        await this.peer.setRemoteDescription(new RTCSessionDescription(signal.data));
        break;
      case 'candidate':
        if (this.peer) await this.peer.addIceCandidate(signal.data);
        break;
      case 'reject':
      case 'end':
        if (this.onEnded) this.onEnded();
        this.endCall();
        break;
    }
  }
}

