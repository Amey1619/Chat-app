import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import io from "socket.io-client";
import { ChatState } from "../Context/ChatProvider";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import ScrollableChat from "./ScrollableChat";
import ProfileModal from "./miscellaneous/ProfileModal";
import { getSender, getSenderFull } from "../config/ChatLogics";
import {
  Box,
  Text,
  FormControl,
  IconButton,
  Input,
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { ArrowBackIcon, AttachmentIcon } from "@chakra-ui/icons";
import "./mystyle.css";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import SmileyIcon from "./miscellaneous/SmileyIcon";

const ENDPOINT = "http://localhost:5000";
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const toast = useToast();
  const inputRef = useRef();

  const { user, selectedChat, setSelectedChat, notification, setNotification } =
    ChatState();

  const postImage = (pics) => {
    setLoading(true);
    if (pics === undefined) {
      setLoading(false);
      return;
    }
    if (
      pics.type === "image/jpeg" ||
      pics.type === "image/png" ||
      pics.type === "image/gif"
    ) {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "chats-app");
      data.append("cloud_name", "dx2c2nxsx");
      fetch("https://api.cloudinary.com/v1_1/dx2c2nxsx/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          sendImgMessage(data.url.toString());
          setLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    } else {
      toast({
        title: "Please select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setLoading(false);
      return;
    }
  };

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      setLoading(true);
      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );
      setMessages(data);
      setLoading(false);
      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const fetchNotifications = async () => {
    try {
      const { data } = await axios.get(`/api/notifs/${user._id}`);
      const filteredData = data.map((notif) => ({
        chat: {
          chatName: notif.chatName,
          isGroupChat: notif.isGroupChat,
          users: notif.users,
          latestMessage: notif.latestMessage,
          _id: notif.chat,
        },
        _id: notif._id,
      }));
      // console.log("Amey Filtered Notifications:", filteredData);
      setNotification(filteredData);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
      setNotification([]);
    }
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));
  }, []);

  const sendMessage = async (event) => {
    if (event.key === "Enter" && newMessage) {
      socket.emit("stop typing", selectedChat._id);
      try {
        const config = {
          headers: {
            "Content-Type": "Application/json",
            Authorization: `Bearer ${user.token}`,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "/api/message",
          {
            content: newMessage,
            chatId: selectedChat._id,
          },
          config
        );
        socket.emit("new message", data);
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const sendImgMessage = async (imageUrl) => {
    try {
      const config = {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post(
        "/api/message",
        {
          content: imageUrl,
          chatId: selectedChat._id,
        },
        config
      );

      socket.emit("new message", data);
      setMessages([...messages, data]);
    } catch (error) {
      toast({
        title: "Error Occurred!",
        description: "Failed to send the image",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  useEffect(() => {
    fetchMessages();
    fetchNotifications();
    selectedChatCompare = selectedChat;
  }, [selectedChat]);

  // console.log("Amey logged this:->", notification);

  useEffect(() => {
    if (!socket) return;

    const messageHandler = async (newMessageRecieved) => {
      if (
        !selectedChatCompare ||
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (
          !notification.some((notif) => notif._id === newMessageRecieved._id)
        ) {
          const notifs = {
            id: newMessageRecieved._id,
            chat: newMessageRecieved.chat._id,
            chatName: newMessageRecieved.chat.chatName,
            isGroupChat: newMessageRecieved.chat.isGroupChat,
            latestMessage: newMessageRecieved.chat.latestMessage,
            users: newMessageRecieved.chat.users.map((u) => ({
              _id: u._id,
              name: u.name,
            })),
          };
          try {
            await axios.post("/api/notifs", notifs);
          } catch (error) {
            console.error("Error storing notification", error);
          }
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    };

    socket.on("message recieved", messageHandler);

    return () => {
      socket.off("message recieved", messageHandler);
    };
  }, [socket, selectedChatCompare]);

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            width="100%"
            fontFamily="Work sans"
            display="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              display={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {!selectedChat.isGroupChat ? (
              <>
                {getSender(user, selectedChat.users)}
                <ProfileModal user={getSenderFull(user, selectedChat.users)} />
              </>
            ) : (
              <>
                {selectedChat.chatName.toUpperCase()}
                <UpdateGroupChatModal
                  fetchAgain={fetchAgain}
                  setFetchAgain={setFetchAgain}
                  fetchMessages={fetchMessages}
                />
              </>
            )}
          </Text>
          <Box
            display="flex"
            flexDir="column"
            justifyContent="flex-end"
            padding={3}
            bg="#E8E8E8"
            width="100%"
            height="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}
            <FormControl
              onKeyDown={sendMessage}
              isRequired
              mt={3}
              display="flex"
              justifyContent="flex-end"
              position="relative"
            >
              {istyping ? <div>Typing...</div> : <></>}
              <Input
                bg="#E0E0E0"
                placeholder="Type a message..."
                value={newMessage}
                onChange={typingHandler}
              />
              {showEmojiPicker && (
                <Box
                  position="absolute"
                  bottom="60px"
                  right="80px"
                  zIndex={100}
                >
                  <Picker
                    data={data}
                    onEmojiSelect={(emoji) =>
                      setNewMessage((prev) => prev + emoji.native)
                    }
                  />
                </Box>
              )}
              <>
                <Input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  ref={inputRef}
                  onChange={(e) => postImage(e.target.files[0])}
                />
                <IconButton
                  size={"md"}
                  bg="transparent"
                  _hover={{
                    color: "blue.500",
                  }}
                  p={1}
                  borderRadius="xl"
                  color="gray.600"
                  icon={<SmileyIcon />}
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                />
                <IconButton
                  size={"lg"}
                  bg="transparent"
                  _hover={{
                    color: "blue.500",
                  }}
                  p={1}
                  borderRadius="lg"
                  color="gray.600"
                  icon={<AttachmentIcon />}
                  onClick={() => {
                    inputRef.current.click();
                  }}
                />
              </>
            </FormControl>
          </Box>
        </>
      ) : (
        <Box
          display="flex"
          alignItems="center"
          justifyContent="center"
          h="100%"
        >
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
