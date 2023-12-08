import React, { useEffect, useState } from 'react'
import axios from 'axios';
import io from "socket.io-client";
import { ChatState } from '../Context/ChatProvider';
import UpdateGroupChatModal from './miscellaneous/UpdateGroupChatModal';
import ScrollableChat from './ScrollableChat';
import ProfileModal from "../Components/miscellaneous/ProfileModal";
import {getSender,getSenderFull} from "../config/ChatLogics";
import { Box,Text,FormControl,IconButton,Input,Spinner,useToast } from '@chakra-ui/react';
import { ArrowBackIcon } from '@chakra-ui/icons';
import './mystyle.css'

const ENDPOINT = "http://localhost:5000"; // "https://talk-a-tive.herokuapp.com"; -> After deployment
var socket, selectedChatCompare;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
      const [messages, setMessages] = useState([]);
      const [loading, setLoading] = useState(false);
      const [newMessage, setNewMessage] = useState("");
      const [typing, setTyping] = useState(false);
      const [istyping, setIsTyping] = useState(false);
      const [socketConnected, setSocketConnected] = useState(false);

    const toast=useToast();

    const {
      user,
      selectedChat,
      setSelectedChat,
      notification,
      setNotification,
    } = ChatState();

     const fetchMessages =async()=>{
      if(!selectedChat)return;

      try{
        const config={
          headers:{
            Authorization: `Bearer ${user.token}`,
          },
        };
        setLoading(true);
        const {data}=await axios.get(`/api/message/${selectedChat._id}`,config);
        setMessages(data);
        setLoading(false);
        socket.emit("join chat", selectedChat._id);
      }
      catch(error){
          toast({
            title: "Error Occured!",
            description: "Failed to Load the Messages",
            status: "error",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
      }
     }
     
    useEffect(() => {
      socket = io(ENDPOINT);
      socket.emit("setup", user);
      socket.on("connected", () => setSocketConnected(true));
      socket.on("typing", () => setIsTyping(true));
      socket.on("stop typing", () => setIsTyping(false));
    }, []);

    const sendMessage= async (event)=>{
      if(event.key==="Enter" && newMessage){
        socket.emit("stop typing", selectedChat._id);
        try{
          const config={
            headers:{
              "Content-Type":"Application/json",
              Authorization: `Bearer ${user.token}`,
            },
          };
          setNewMessage("");
          const {data}=await axios.post('/api/message',{
            content:newMessage,
            chatId:selectedChat._id,
          },config)
          socket.emit("new message", data);
          setMessages([...messages, data]);
        }catch(error){
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

    useEffect(() => {
      fetchMessages();
      selectedChatCompare=selectedChat;
    }, [selectedChat])
    
    // console.log(notification," <-----**");
    
    useEffect(()=>{
      socket.on("message recieved",(newMessageRecieved)=>{
        if (
        !selectedChatCompare ||selectedChatCompare._id !== newMessageRecieved.chat._id
      ){
        //give notification
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      }
      else{
        setMessages([...messages,newMessageRecieved]);
      }
      });
    });


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
            <FormControl onKeyDown={sendMessage} isRequired mt={3}>
              {istyping ? (
                <div>
                 Typing...
                </div>
              ) : (
                <></>
              )}
              <Input
                variant="filled"
                bg="#E0E0E0"
                placeholder="Type a message.."
                value={newMessage}
                onChange={typingHandler}
              />
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
}

export default SingleChat