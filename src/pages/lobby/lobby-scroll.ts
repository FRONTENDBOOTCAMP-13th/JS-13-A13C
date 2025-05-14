const roomList = document.getElementById("room-list") as HTMLElement;
roomList.style.setProperty("overflow", "hidden", "important");
let targetScroll = roomList.scrollTop;
let isTicking = false;

function onWheel(e: WheelEvent) {
  e.preventDefault();
  targetScroll += e.deltaY;
  const max = roomList.scrollHeight - roomList.clientHeight;
  targetScroll = Math.max(0, Math.min(targetScroll, max));
  if (!isTicking) {
    requestAnimationFrame(step);
    isTicking = true;
  }
}

function step() {
  const diff = targetScroll - roomList.scrollTop;
  if (Math.abs(diff) > 0.5) {
    roomList.scrollTop += diff * 0.2;
    requestAnimationFrame(step);
  } else {
    roomList.scrollTop = targetScroll;
    isTicking = false;
  }
}

roomList.addEventListener("wheel", onWheel, { passive: false });
