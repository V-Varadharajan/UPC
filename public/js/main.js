const createUserBtn = document.getElementById("create-user");
const username = document.getElementById("username");
const allusersHtml = document.getElementById("allusers");
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const endCallBtn = document.getElementById("end-call-btn");
const micBtn = document.getElementById("mute-mic-btn");
const camBtn = document.getElementById("disable-cam-btn");

const socket = io();
let localStream;
let caller = [];

// ✅ 1. Initialize User Media Before Connection
async function startMyVideo() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;
    } catch (error) {
        console.error("Error accessing media devices:", error);
    }
}
startMyVideo();

// ✅ 2. Singleton for Peer Connection
const PeerConnection = (function () {
    let peerConnection;

    const createPeerConnection = () => {
        const config = {
            iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        };
        peerConnection = new RTCPeerConnection(config);

        if (localStream) {
            localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
        }

        // Listen for remote stream and attach it to `remoteVideo`
        peerConnection.ontrack = (event) => {
            console.log("Remote stream received:", event.streams);
            if (event.streams && event.streams[0]) {
                remoteVideo.srcObject = event.streams[0];
            }
        };

        // Send ICE candidates to the remote peer
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                socket.emit("icecandidate", event.candidate);
            }
        };

        return peerConnection;
    };

    return {
        getInstance: () => {
            if (!peerConnection || peerConnection.connectionState === "closed" || peerConnection.connectionState === "failed") {
                peerConnection = createPeerConnection();
            }
            return peerConnection;
        },
        closeConnection: () => {
            if (peerConnection) {
                peerConnection.close();
                peerConnection = null;
            }
        }
    };
})();

// ✅ 3. Handle User Join
createUserBtn.addEventListener("click", () => {
    if (username.value !== "") {
        const usernameContainer = document.querySelector(".username-input");
        socket.emit("join-user", username.value);
        usernameContainer.style.display = 'none';
    }
});

// ✅ 4. Handle End Call
endCallBtn.addEventListener("click", () => {
    if (caller.length > 0) {
        socket.emit("call-ended", caller);
        endCall();
    }
});

// ✅ 5. Update Users List
socket.on("joined", allusers => {
    allusersHtml.innerHTML = "";

    for (const user in allusers) {
        const li = document.createElement("li");
        li.textContent = `${user} ${user === username.value ? "(You)" : ""}`;

        if (user !== username.value) {
            const button = document.createElement("button");
            button.classList.add("call-btn");
            button.addEventListener("click", () => startCall(user));

            const img = document.createElement("img");
            img.setAttribute("src", "/images/phone.png");
            img.setAttribute("width", 20);
            button.appendChild(img);

            li.appendChild(button);
        }

        allusersHtml.appendChild(li);
    }
});

// ✅ 6. Start Call Function
async function startCall(targetUser) {
    const pc = PeerConnection.getInstance();

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socket.emit("offer", { from: username.value, to: targetUser, offer });
    caller = [username.value, targetUser];
}

// ✅ 7. Handle Offer Reception
socket.on("offer", async ({ from, to, offer }) => {
    const pc = PeerConnection.getInstance();
    await pc.setRemoteDescription(offer);

    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socket.emit("answer", { from, to, answer: pc.localDescription });
    caller = [from, to];
});

// ✅ 8. Handle Answer Reception
socket.on("answer", async ({ from, to, answer }) => {
    const pc = PeerConnection.getInstance();
    await pc.setRemoteDescription(answer);

    endCallBtn.style.display = 'block';
    caller = [from, to];
});

// ✅ 9. Handle ICE Candidates
socket.on("icecandidate", async candidate => {
    console.log("ICE Candidate received:", candidate);
    const pc = PeerConnection.getInstance();
    await pc.addIceCandidate(new RTCIceCandidate(candidate));
});

// ✅ 10. Handle Call End
socket.on("call-ended", () => {
    endCall();
});

// ✅ 11. End Call Function
function endCall() {
    PeerConnection.closeConnection();
    endCallBtn.style.display = "none";
    remoteVideo.srcObject = null;
    caller = [];
}

// ✅ 12. Toggle Mic Function
const toggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        micBtn.firstElementChild.src = audioTrack.enabled ? "/images/mic-on.png" : "/images/mic-off.png";
    }
};

// ✅ 13. Toggle Camera Function
const toggleCam = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        camBtn.firstElementChild.src = videoTrack.enabled ? "/images/cam-on.png" : "/images/cam-off.png";
    }
};

micBtn.addEventListener("click", toggleMic);
camBtn.addEventListener("click", toggleCam);
