import { joinRoom, socket, type JoinRoomParams, type Player, type RoomMembers } from "../A13C-chat";
import ingameUI from './ingame-ui';
import scoreTable from './score-table';
import chat from './chat';
import { getPlayerCount, getPlayerList, getRoomName, getUserId, setPlayerList, setRoomName, setUserId } from "./store";

const urlParams = new URLSearchParams(location.search);
const roomId = urlParams.get('roomId');
const nickName = urlParams.get('nickName');



if(roomId && nickName) {
  const params: JoinRoomParams = {
    roomId,
    user_id: nickName,
    nickName,
  };

  const joinRoomRes = await joinRoom(params);
  console.log('joinRoomRes', joinRoomRes);
  if(joinRoomRes.ok){
    setUserId(nickName);
    const playerList = Object.values(joinRoomRes.roomInfo.memberList);
    console.log('플레이어 목록', playerList);
    setPlayerList(playerList);
    setRoomName(joinRoomRes.roomInfo.roomName);
    refreMembers(playerList);
    document.querySelector('#connectedRoom')!.innerHTML = `방이름: ${getRoomName()} (${getPlayerCount()}/5)`;
  }else{
    alert(joinRoomRes.message);
  }
}else{
  alert('잘못된 경로로 접근했습니다. 로비로 이동합니다.');
  location.href = '/src/pages/lobby.html';
}


/**
 * 채팅방 멤버 목록 수신 이벤트 리스너
 * @description 현재 참여 중인 채팅방의 멤버 목록이 업데이트될 때 호출됩니다.
 * @param members - 현재 채팅방의 모든 멤버 정보를 담고 있는 객체
 */
socket.on("members", refreMembers);

function refreMembers(members: Player[]){
  setPlayerList(Object.values(members));
  const playerList = getPlayerList();
  let position = 1;
  for(let i = 0; i < playerList.length; i++){
    const player = playerList[i];
    console.log(getUserId(), player.nickName);
    if(getUserId() !== player.nickName){
      document.querySelector(`#nickname-${position++}`)!.textContent = player.nickName;      
    }
  }
  document.querySelector('#connectedRoom')!.innerHTML = `방이름: ${getRoomName()} (${getPlayerCount()}/5)`;
}

