const video = document.getElementById('video');
const canvas = document.getElementById('crack-canvas');
const ctx = canvas.getContext('2d');
const hammer = document.getElementById('hammer');
const cameraWrapper = document.getElementById('camera-wrapper');
const cam = document.getElementById('cam-wrapper'); 


let hammerIndex = 0;
let hitCount = 0;
let isBroken = false;

// 🟡 캠 연결
navigator.mediaDevices.getUserMedia({ video: true, audio: false }).then(stream => {
  video.srcObject = stream;
});


let rotationX = 0;
let rotationY = 0;
let velocityX = 0;
let velocityY = 0;
let isHitAnimating = false;

// 🟥 클릭 이벤트
document.addEventListener('click', e => {
    if (isBroken) return;
  
    const { x, y } = getClickRelativePosition(e);
    swingHammer();
    tiltCamera(x, y);
    drawCrack(x, y);
  
    hitCount++;
    if (hitCount >= 5) {
      breakCamera();
    }
  });

function hitCamera(clickX, clickY) {
  const rect = cam.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const dx = clickX - centerX;
  const dy = clickY - centerY;

  // 클릭한 위치에 따라 힘을 줌
  velocityX = dy * 0.002;
  velocityY = -dx * 0.002;

  if (!isHitAnimating) {
    isHitAnimating = true;
    animateSwing();
  }
}

function animateSwing() {
  const stiffness = 1;   // 복원력
  const damping = 0.2;      // 감속

  rotationX += velocityX;
  rotationY += velocityY;

  // 복원력 (중심으로 돌아오려는 힘)
  velocityX -= rotationX * stiffness;
  velocityY -= rotationY * stiffness;

  // 감속
  velocityX *= damping;
  velocityY *= damping;

  cam.style.transform = `rotateX(${rotationX}deg) rotateY(${rotationY}deg)`;

  if (Math.abs(velocityX) > 0.001 || Math.abs(velocityY) > 0.001) {
    requestAnimationFrame(animateSwing);
  } else {
    isHitAnimating = false;
  }
}



// 🔵 크기 조정
function resize() {
  canvas.width = cameraWrapper.clientWidth;
  canvas.height = cameraWrapper.clientHeight;
}
window.addEventListener('resize', resize);
resize();

// 🔨 커서 따라다니기
document.addEventListener('mousemove', e => {
  hammer.style.left = e.pageX - 90 + 'px';
  hammer.style.top = e.pageY - 50 + 'px';
});

// ⬅️ 스페이스로 망치 변경
document.addEventListener('keydown', e => {
  if (e.code === 'Space') {
    hammerIndex = (hammerIndex + 1) % 5;
    hammer.src = `hammer${hammerIndex + 1}.svg`;
  }
});



document.addEventListener('mousemove', e => {
    hammer.style.left = e.pageX + 'px';
    hammer.style.top = e.pageY + 'px';
  });
  

// 🛠️ 망치 휘두르기 애니메이션
function swingHammer() {
    hammer.style.transition = 'transform 0.15s ease';
    hammer.style.transform = 'rotate(-50deg)';
  
    setTimeout(() => {
      hammer.style.transform = 'rotate(0deg)';
    }, 170);
  }
  
  
  
// 🌀 캠 기울이기
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

// 🧠 클릭 상대 좌표
function getClickRelativePosition(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top
  };
}

// ⚡ 크랙 그리기
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

// 맨 아래에 넣기 (모든 함수 정의 아래에)
document.addEventListener('DOMContentLoaded', () => {
    cam.addEventListener('click', e => {
      swingHammer(); // 망치 모션
      drawCrack(e.pageX, e.pageY); // 크랙
      hitCamera(e.pageX, e.pageY); // 물리 회전
    });
  });
  
  