import type { Player, RoundResult } from "../A13C-chat";

let user_id: string;

let round: number = 1;

let playerList: Player[] = [];

let roundResults: RoundResult[] = [];

let roomName: string;

export function setRoomName(name: string){
  roomName = name;
}

export function getRoomName(){
  return roomName;
}

export function addResult(roundResult: RoundResult){
  roundResults.push(roundResult);
}

export function getResults(){
  return roundResults;
}

export function getResult(round: number){
  return roundResults[round-1];
}

export function setUserId(userId: string){
  user_id = userId;
}

export function getUserId(){
  return user_id;
}

export function setPlayerList(players: Player[]){
  playerList = players;
}

export function getPlayerList(){
  return playerList;
}

export function getPlayerCount(){
  return playerList.length;
}

export function getPlayer(user_id: string){
  return playerList?.find(player => player.nickName === user_id);
}

export function isAllDone(){
  return playerList.every(player => player.onecard);
}

export function nextRound(){
  round++;
  playerList.forEach(player => {
    player.twocard = [];
    player.onecard = 0;
  });
}

export function getRound(){
  return round;
}