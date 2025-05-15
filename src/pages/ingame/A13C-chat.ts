import io from "socket.io-client";

/**
 * 채팅 메시지의 구조를 정의하는 인터페이스
 */
export interface ChatMessage {
  nickName: string;
  msg: string;
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
  [key: string]: RoomMember;
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
}

/**
 * 채팅방 생성 응답을 정의하는 인터페이스
 */
export interface CreateRoomResponse {
  roomInfo: any;
  success: boolean;
  roomList: { [key: string]: RoomInfo };
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
  ok: number;
  message: string;
  roomInfo: RoomInfo;
}

/**
 * 채팅방 목록 응답을 정의하는 인터페이스
 */
export interface RoomsResponse {
  [key: string]: RoomInfo;
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
 * 모든 채팅방 목록을 조회하는 함수
 * @returns Promise<RoomsResponse> - 전체 채팅방 목록
 */
export function getRooms(): Promise<RoomsResponse> {
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
export function sendMsg(msg: string): void {
  if (msg.trim()) {
    socket.emit("message", msg);
  }
}

/**
 * 채팅 메시지 수신 이벤트 리스너
 * @description 다른 사용자가 보낸 채팅 메시지를 수신할 때 호출됩니다.
 * @param data - 수신된 채팅 메시지 정보 (발신자 닉네임과 메시지 내용)
 */
socket.on("message", (data: ChatMessage) => {
  console.log(`${data.nickName}: ${data.msg}`);
});

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

// 멤버 목록 요청 함수 추가
export function requestMembers() {
  const currentRoom = JSON.parse(
    localStorage.getItem("A13C_CURRENT_ROOM") || "null"
  );
  if (currentRoom && currentRoom.roomId) {
    socket.emit("get_members", { roomId: currentRoom.roomId });
  }
}
