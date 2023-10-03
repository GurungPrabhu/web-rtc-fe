/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { Col, Row } from "antd";

const RoomPage: React.FC = () => {
  const { id } = useParams();
  const userVideo = useRef<any>();
  const partnerVideo = useRef<any>();
  const userStream = useRef<any>();
  const peerRef = useRef<any>();
  const webSocketRef = useRef<any>();

  const openCamera = async () => {
    const allDevices = await navigator.mediaDevices.enumerateDevices();
    const camera = allDevices.filter((device) => device.kind === "videoinput");
    const constraints: any = {
      audio: true,
      video: {
        deviceId: camera[1],
      },
    };
    try {
      return navigator.mediaDevices.getUserMedia(constraints);
    } catch (err) {
      console.log("err", err);
    }
  };

  useEffect(() => {
    openCamera().then((stream) => {
      userVideo.current.srcObject = stream;
      userStream.current = stream;

      webSocketRef.current = new WebSocket(
        `ws://localhost:5003/join?roomID=${id}`
      );
      webSocketRef.current.addEventListener("open", () => {
        console.log("Sending");
        webSocketRef.current.send(JSON.stringify({ join: "true" }));
      });

      webSocketRef.current.addEventListener("message", (e: any) => {
        console.log("MESSAGE RECEIVED", e.data);
        const message = JSON.parse(e.data);
        if (message.join) {
          callUser();
        }

        if (message.iceCandidate) {
          console.log("Receiving and adding ICE Candidate");
          try {
            peerRef.current.addIceCandidate(message.iceCandidate);
          } catch (err) {
            console.log("ERROR", err);
          }
        }

        if (message.offer) {
          handleOffer(message.offer);
        }

        if (message.answer) {
          console.log("Receiving answer");
          peerRef.current.setRemoteDescription(
            new RTCSessionDescription(message.answer)
          );
          handleOffer(message.offer);
        }
      });
    });
  }, []);

  const handleOffer = async (offer: any) => {
    console.log("OFFER RECEIVED", offer);
    peerRef.current = createPeer();

    await peerRef.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    userStream.current.getTracks().forEach((track: any) => {
      peerRef.current.addTrack(track, userStream.current);
    });

    const answer = await peerRef.current.createAnswer();
    await peerRef.current.setLocalDescription(answer);

    webSocketRef.current.send(
      JSON.stringify({ answer: peerRef.current.localDescription })
    );
  };

  const callUser = () => {
    console.log("CALLING USER");
    peerRef.current = createPeer();

    userStream.current.getTracks().forEach((track: any) => {
      peerRef.current.addTrack(track, userStream.current);
    });
  };

  const createPeer = () => {
    console.log("Creating Peer Connection");
    const peer = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
    peer.onnegotiationneeded = handleNegotiation;
    peer.onicecandidate = handleIceCandidateEvent;
    peer.ontrack = handleTrackEvent;
    return peer;
  };

  const handleNegotiation = async () => {
    console.log("Creating Offer");
    try {
      const myOffer = await peerRef.current.createOffer();
      await peerRef.current.setLocalDescription(myOffer);

      webSocketRef.current.send(
        JSON.stringify({ offer: peerRef.current.localDescription })
      );
    } catch (err) {
      console.log("ERR", err);
    }
  };
  const handleIceCandidateEvent = (e: any) => {
    console.log("Found ICE candidate");
    if (e.candidate) {
      console.log("Candidate found", e.candidate);
      webSocketRef.current.send(JSON.stringify({ iceCandidate: e.candidate }));
    }
  };

  const handleTrackEvent = (e: any) => {
    console.log("HANDLE TRACK EVENT", e.streams[0]);
    partnerVideo.current.srcObject = e.streams[0];
  };

  return (
    <Row>
      <Col span={6}>
        <video autoPlay controls={true} ref={userVideo}></video>
      </Col>
      <Col span={6}>
        <video autoPlay controls={true} ref={partnerVideo}></video>
      </Col>
    </Row>
  );
};
export { RoomPage };
