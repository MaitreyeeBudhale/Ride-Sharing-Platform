import { io } from "socket.io-client";

const getCookie = (name) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return null;
};

export const socket = io("http://localhost:5000", {
  autoConnect: false,
  withCredentials: true,
});

// Intercept connection to attach JWT token
const originalConnect = socket.connect.bind(socket);
socket.connect = () => {
  const token = getCookie("token");
  if (token) {
    socket.auth = { token };
  }
  return originalConnect();
};

export default socket;

