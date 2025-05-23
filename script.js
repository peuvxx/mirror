const video = document.getElementById('video');
const canvas = document.getElementById('crack-canvas');
const ctx = canvas.getContext('2d');
const hammer = document.getElementById('hammer');
const cameraWrapper = document.getElementById('camera-wrapper');
const cam = document.getElementById('camera-wrapper');

// 얼굴 인식 디버깅용 캔버스
const debugCanvas = document.getElementById('face-debug');
const debugCtx = debugCanvas.getContext('2d');

let hammerIndex = 0;
let hitCount = 0;
let isBroken = false;

// ✅ video 메타데이터 로드 후 debugCanvas 해상도 동기화
function syncDebugCanvasSize() {
  debugCanvas.width = video.videoWidth;
  debugCanvas.height = video.videoHeight;
}

// 캠 연결
navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
  video.srcObject = stream;

  video.addEventListener('loadedmetadata', () => {
    syncDebugCanvasSize();     // ✅ 비디오 크기 기준으로 디버그 캔버스 맞춤
    loadFaceModel();           // 모델은 metadata 로드 후 불러야 크기가 정확
  });
});

// 프레임 캡쳐 함수
async function captureFrame() {
  const wrapper = document.getElementById('camera-wrapper');
  const canvas = await html2canvas(wrapper, {
    backgroundColor: null
  });
  return canvas.toDataURL('image/png');
}

// 얼굴인식 관련 변수
let prevAngle = 0;
let faceInterval;

async function loadFaceModel() {
  await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
  await faceapi.nets.faceLandmark68TinyNet.loadFromUri('/models');
  startFaceTracking();
}

function startFaceTracking() {
  faceInterval = setInterval(async () => {
    const result = await faceapi
      .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks(true);

    debugCtx.clearRect(0, 0, debugCanvas.width, debugCanvas.height);

    if (result) {
      console.log("✅성공");

      const dims = faceapi.matchDimensions(debugCanvas, video, true);
      const resizedResult = faceapi.resizeResults(result, dims);

      const box = resizedResult.detection.box;
      const score = resizedResult.detection.score;
      
      
      // ✅ 박스 그리기
      debugCtx.strokeStyle = '#00f';
      debugCtx.lineWidth = 3;
      debugCtx.strokeRect(box.x, box.y, box.width, box.height);
      
      // ✅ 점수에 따라 텍스트 설정
      let label = '';
      if (score > 0.9) {
        label = 'who are you?';
      } else if (score > 0.7) {
        label = 'who are you?';
      } else {
        label = 'who are you?';
      }
      
      // ✅ 텍스트 그리기
      debugCtx.fillStyle = 'blue';
      debugCtx.font = '20px sans-serif';
      debugCtx.fillText(label, box.x, box.y - 10);
      
      faceapi.draw.drawFaceLandmarks(debugCanvas, resizedResult);
      console.log("랜드마크 그리기 실행");

      const landmarks = result.landmarks;
      const nose = landmarks.getNose();
      const leftEye = landmarks.getLeftEye();
      const rightEye = landmarks.getRightEye();

      const eyeDx = rightEye[0].x - leftEye[3].x;
      const noseDx = nose[3].x - (leftEye[3].x + eyeDx / 2);
      const angle = noseDx / eyeDx;

      if (angle - prevAngle > 0.15) {
        changeHammer(+1);
        prevAngle = angle;
      } else if (angle - prevAngle < -0.15) {
        changeHammer(-1);
        prevAngle = angle;
      }
    } else {
      console.log("❌실패");
    }
  }, 500);
}

function changeHammer(direction) {
  hammerIndex = (hammerIndex + direction + 5) % 5;
  hammer.src = `hammer${hammerIndex + 1}.svg`;
}

async function breakReality() {
  const wrapper = document.getElementById('camera-wrapper');
  const captured = await captureFrame();
  const shardCount = Math.floor(Math.random() * 20) + 20;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  video.style.display = 'none';

  for (let i = 0; i < shardCount; i++) {
    const shard = document.createElement('canvas');
    shard.width = window.innerWidth;
    shard.height = window.innerHeight;
    shard.className = 'shard-canvas';
    shard.style.position = 'absolute';
    shard.style.left = '0';
    shard.style.top = '0';
    shard.style.zIndex = 3;

    const shardCtx = shard.getContext('2d');
    const centerX = Math.random() * window.innerWidth;
    const centerY = Math.random() * window.innerHeight;
    const sides = 3 + Math.floor(Math.random() * 4);
    const angleStart = Math.random() * Math.PI * 2;

    shardCtx.beginPath();
    for (let j = 0; j <= sides; j++) {
      const angle = angleStart + j * (2 * Math.PI / sides);
      const radius = 100 + Math.random() * 150;
      const px = centerX + Math.cos(angle) * radius;
      const py = centerY + Math.sin(angle) * radius;
      if (j === 0) shardCtx.moveTo(px, py);
      else shardCtx.lineTo(px, py);
    }
    shardCtx.closePath();
    shardCtx.clip();

    const img = new Image();
    img.onload = () => shardCtx.drawImage(img, 0, 0, shard.width, shard.height);
    img.src = captured;

    wrapper.appendChild(shard);

    setTimeout(() => {
      shard.style.transition = 'transform 2.8s ease, opacity 2.8s ease';
      shard.style.transform = `translateY(${1000 + Math.random() * 800}px)`;
      shard.style.opacity = 0;
    }, 50);
  }

  setTimeout(() => {
    document.querySelectorAll('.shard-canvas').forEach(c => c.remove());
    video.style.display = 'block';
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hitCount = 0;
    isBroken = false;
  }, 3000);
}

// 망치 휘두르기
function swingHammer() {
  hammer.style.transition = 'transform 0.15s ease';
  hammer.style.transform = 'rotate(-50deg)';
  setTimeout(() => {
    hammer.style.transform = 'rotate(0deg)';
  }, 170);
}

// 캠 기울이기
function tiltCamera(x, y) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const offsetX = x - centerX;
  const offsetY = y - centerY;

  const rotateX = -(offsetY / centerY) * 260;
  const rotateY = (offsetX / centerX) * 260;

  cameraWrapper.style.transition = 'transform 0.6s ease-out';
  cameraWrapper.style.transform = `translate(-50%, -50%) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  setTimeout(() => {
    cameraWrapper.style.transition = 'transform s ease-out';
    cameraWrapper.style.transform = `translate(-50%, -50%) rotateX(0deg) rotateY(0deg)`;
  }, 100);
}

// 클릭 상대 좌표
function getClickRelativePosition(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// 크랙 그리기
function drawCrack(x, y) {
  const startCount = Math.floor(Math.random() * 5) + 7;
  const maxDepth = 2;

  function drawBranch(startX, startY, depth, angle) {
    if (depth > maxDepth) return;
    const length = 40 + Math.random() * 60;
    const endX = startX + Math.cos(angle) * length;
    const endY = startY + Math.sin(angle) * length;

    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2.5 + Math.random() * 1.5;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    const branches = Math.floor(Math.random() * 2) + 1;
    for (let i = 0; i < branches; i++) {
      const newAngle = angle + (Math.random() - 0.5) * Math.PI / 1.8;
      drawBranch(endX, endY, depth + 1, newAngle);
    }
  }

  for (let i = 0; i < startCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    drawBranch(x, y, 0, angle);
  }
}

// 크기 동기화
function resize() {
  canvas.width = cameraWrapper.clientWidth;
  canvas.height = cameraWrapper.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// 키보드로 망치 바꾸기
document.addEventListener('click', async e => {
  swingHammer(); // 무조건 휘두름

  if (!isBroken) {
    const { x, y } = getClickRelativePosition(e);
    tiltCamera(x, y);
    drawCrack(x, y);

    hitCount++;
    if (hitCount >= 5) {
      isBroken = true;
      await breakReality();
    }
  } else {
    // 이미 깨졌으면 카운트/크랙은 무시하고 망치만 바꾸기
    changeHammer(1);
  }
});


// 커서 따라가기
document.addEventListener('mousemove', e => {
  hammer.style.left = e.pageX + 'px';
  hammer.style.top = e.pageY + 'px';
});

// 클릭 시 크랙 및 애니메이션
document.addEventListener('click', e => {
  if (isBroken) return;

  const { x, y } = getClickRelativePosition(e);
  swingHammer();
  tiltCamera(x, y);
  drawCrack(x, y);

  hitCount++;
  if (hitCount >= 5) {
    isBroken = true;
    breakReality();
  }
});
