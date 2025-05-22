import io from "socket.io-client";

/**
 * 채팅 메시지의 구조를 정의하는 인터페이스
 */
export interface ChatMessage {
  nickName: string;
  msg: ChoiceTwoCard | ChoiceOneCard;
}

/**
 * 채팅방 멤버의 정보를 정의하는 인터페이스
 */
export interface RoomMember {
  user_id: string;
  nickName: string;
}

/**
 * 채팅방의 멤버 목록을 정의하는 인터페이스
 * @description 채팅방의 모든 멤버 정보를 담고 있는 객체 타입입니다.
 * 키는 user_id를, 값은 RoomMember 타입의 멤버 정보를 가집니다.
 */
export interface RoomMembers {
  // [key: string]: 타입 스크립트의 타입 정의 방법중 하나인 index signature
  // 속성명을 명시하지 않고 속성명의 타입과 속성값의 타입을 정의
  // 인터페이스에 정의할 여러 속성들이 동일한 타입을 가지고 있을 때 모든 속성을 기술하지 않고 인덱스 시그니처 하나로 정의 가능
  // "key"라는 문자 대신 아무 문자나 사용 가능
  // 속성명의 타입은 string, number, symbol만 사용 가능
  [key: string]: Player;
}

/**
 * 채팅방의 전체 정보를 정의하는 인터페이스
 */
export interface RoomInfo {
  roomId: string;
  user_id: string;
  hostName: string;
  roomName: string;
  parents_option: any;
  memberList: RoomMembers;
}

/**
 * 채팅방 생성 요청 파라미터를 정의하는 인터페이스
 */
export interface CreateRoomParams {
  roomId?: string; // 생략 시 자동으로 랜덤 문자열 생성
  user_id: string;
  roomName: string;
  hostName: string;
  autoClose?: boolean;
  capacity?: number;
}

/**
 * 채팅방 생성 응답을 정의하는 인터페이스
 */
export interface CreateRoomResponse {
  ok: boolean;
  message: string;
  roomInfo: RoomInfo;
}

/**
 * 채팅방 입장 요청 파라미터를 정의하는 인터페이스
 */
export interface JoinRoomParams {
  roomId: string;
  user_id: string;
  nickName?: string;
}

/**
 * 채팅방 입장 응답을 정의하는 인터페이스
 */
export interface JoinRoomResponse {
  ok: boolean;
  message: string;
  roomInfo: RoomInfo;
}

/**
 * 채팅방 목록 응답을 정의하는 인터페이스
 */
export interface RoomsResponse {
  [key: string]: RoomInfo;
}

export interface ChoiceTwoCard{
  action: 'twocard';
  user_id: string;
  left: number;
  right: number;
}

export interface ChoiceOneCard{
  action: 'onecard';
  user_id: string;
  choice: number;
}

export interface Player{
  nickName: string;
  score: number;
  twocard: number[];
  onecard: number;
}

export interface RoundResult{
  round: number;
  winners: string[];
  point: number;
  draw: boolean;
}

/**
 * 모든 방 삭제
 * @description 생성된 모든 방을 삭제합니다. 개발중에 만들어진 불필요한 방을 정리할때 사용합니다.
 * 서버에 cleanRooms 이벤트를 발생시켜 모든 방을 삭제합니다.
 */
export function cleanRooms() {
  socket.emit('cleanRooms');
}



// npm i @types/socket.io-client 필요
export const socket = io("ws://fesp-api.koyeb.app/febc13-chat/team02");

/**
 * 소켓 연결 이벤트 리스너
 * @description 서버와의 소켓 연결이 성공적으로 이루어졌을 때 호출됩니다.
 * 연결 성공 시 전체 채팅방 목록을 요청하여 콘솔에 출력합니다.
 */
socket.on("connect", () => {
  console.log("서버와 연결됨");
  socket.emit("rooms", (rooms: RoomsResponse) => {
    console.log("전체 채팅방 목록:", rooms);
  });
});

/**
 * 소켓 연결 종료 이벤트 리스너
 * @description 서버와의 소켓 연결이 종료되었을 때 호출됩니다.
 * 네트워크 오류나 서버 종료 등의 상황에서 발생할 수 있습니다.
 */
socket.on("disconnect", () => {
  console.log("서버 연결 종료");
});

/**
 * 새로운 채팅방을 생성하는 함수
 * @param params - 채팅방 생성에 필요한 파라미터
 * @returns Promise<CreateRoomResponse> - 채팅방 생성 결과
 * @throws {Error} user_id나 roomName이 비어있을 경우 에러 발생
 */
export function createRoom(
  params: CreateRoomParams
): Promise<CreateRoomResponse> {
  if (!params.user_id.trim()) {
    throw new Error("user_id가 없습니다.");
  }
  if (!params.roomName.trim()) {
    throw new Error("roomName이 없습니다.");
  }
  return new Promise((resolve) => {
    socket.emit("createRoom", params, (res: CreateRoomResponse) => {
      resolve(res);
    });
  });
}

/**
 * 기존 채팅방에 입장하는 함수
 * @param params - 채팅방 입장에 필요한 파라미터
 * @returns Promise<JoinRoomResponse> - 채팅방 입장 결과
 * @throws {Error} roomId, user_id, nickName이 비어있을 경우 에러 발생
 */
export function joinRoom(params: JoinRoomParams): Promise<JoinRoomResponse> {
  if (!params.roomId.trim()) {
    throw new Error("roomId가 없습니다.");
  }
  if (!params.user_id.trim()) {
    throw new Error("user_id가 없습니다.");
  }
  return new Promise((resolve) => {
    socket.emit("joinRoom", params, (res: JoinRoomResponse) => {
      resolve(res);
    });
  });
}

/**
 * 채팅방을 삭제하는 함수
 * @param roomId - 삭제할 채팅방의 ID
 * @returns Promise<{ok: boolean, message: string}> - 채팅방 삭제 결과
 */
export function deleteRoom(roomId: string): Promise<{ok: boolean, message: string}> {
  return new Promise((resolve) => {
    socket.emit("deleteRoom", { roomId }, (response: {ok: boolean, message: string}) => {
      console.log(`방 삭제 응답 (${roomId}):`, response);
      resolve(response);
    });
  });
}

/**
 * 모든 채팅방 목록을 조회하는 함수
 * @param _queryString - 캐시 방지를 위한 쿼리 문자열 (선택적)
 * @returns Promise<RoomsResponse> - 전체 채팅방 목록
 */
export function getRooms(_queryString = ""): Promise<RoomsResponse> { //queryString 앞에 _를 붙여 사용되지 않고 있음을 나타냄
  return new Promise((resolve) => {
    socket.emit("rooms", (rooms: RoomsResponse) => {
      resolve(rooms);
    });
  });
}

/**
 * 특정 채팅방의 정보를 조회하는 함수
 * @param roomId - 조회할 채팅방의 ID
 * @returns Promise<RoomInfo> - 채팅방 정보
 */
export function getRoomInfo(roomId: string): Promise<RoomInfo> {
  return new Promise((resolve) => {
    socket.emit("roomInfo", roomId, (roomInfo: RoomInfo) => {
      resolve(roomInfo);
    });
  });
}

/**
 * 현재 채팅방에서 나가는 함수
 * @description 사용자가 현재 참여 중인 채팅방을 나갈 때 호출되는 함수입니다.
 * 서버에 leaveRoom 이벤트를 발생시켜 채팅방 퇴장을 알립니다.
 */
export function leaveRoom(): void {
  socket.emit("leaveRoom");
}

/**
 * 현재 채팅방에 메시지를 전송하는 함수
 * @param msg - 전송할 메시지 내용
 * @description 사용자가 입력한 메시지를 현재 참여 중인 채팅방에 전송합니다.
 * 빈 문자열이나 공백만 있는 메시지는 전송되지 않습니다.
 */
export function sendMsg<T>(msg: T): void {
  socket.emit("message", msg);
}

// 사용자 입장/퇴장 메시지 표시 함수 추가 
export function systemMessage(message: string): void {
  socket.emit("message", {
    nickName: "시스템",
    msg: message
  });
}

/**
 * 채팅방 목록 수신 이벤트 리스너
 * @description 서버로부터 전체 채팅방 목록을 수신할 때 호출됩니다.
 * @param rooms - 전체 채팅방 정보를 담고 있는 객체
 */
socket.on("rooms", (rooms: RoomsResponse) => {
  console.log("채팅방 목록 수신:", rooms);
});

/**
 * 채팅방 멤버 목록 수신 이벤트 리스너
 * @description 현재 참여 중인 채팅방의 멤버 목록이 업데이트될 때 호출됩니다.
 * @param members - 현재 채팅방의 모든 멤버 정보를 담고 있는 객체
 */
socket.on("members", (members: RoomMembers) => {
  console.log("현재 채팅방 멤버:", members);
});
