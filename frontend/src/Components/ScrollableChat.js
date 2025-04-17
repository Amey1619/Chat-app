import React from 'react'
import { isLastMessage, isSameSender, isSameSenderMargin, isSameUser } from '../config/ChatLogics';
import { ChatState } from '../Context/ChatProvider';
import { Avatar, Tooltip, Image } from "@chakra-ui/react";
import ScrollableFeed from "react-scrollable-feed";

const ScrollableChat = ({ messages }) => {
  const { user } = ChatState();

  return (
    <ScrollableFeed>
      {messages &&
        messages.map((m, i) => (
          <div style={{ display: "flex" }} key={m._id}>
            {(isSameSender(messages, m, i, user._id) ||
              isLastMessage(messages, i, user._id)) && (
              <Tooltip label={m.sender.name} placement="bottom-start" hasArrow>
                <Avatar
                  mt="7px"
                  mr={1}
                  size="sm"
                  cursor="pointer"
                  name={m.sender.name}
                  src={m.sender.pic}
                />
              </Tooltip>
            )}
            <span
              style={{
                backgroundColor: `${
                  m.sender._id === user._id ? "#BEE3F8" : "#B9F5D0"
                }`,
                marginLeft: isSameSenderMargin(messages, m, i, user._id),
                marginTop: isSameUser(messages, m, i, user._id) ? 3 : 10,
                borderRadius: "20px",
                maxWidth: "70%",
              }}
            >
              {m.content.includes("cloudinary") ||
              /\.(jpeg|jpg|png|gif|webp)$/i.test(m.content) ? (
                <img
                  src={m.content}
                  alt="sent media"
                  style={{
                    padding: "10px",
                    maxHeight: "350px",
                    borderRadius: "10px",
                    display: "block",
                    margin: "0 auto",
                    objectFit: "cover",
                  }}
                />
              ) : (
                <span
                  style={{
                    display: "inline-block",
                    whiteSpace: "pre-wrap",
                    padding: "5px 15px",
                  }}
                >
                  {m.content}
                </span>
              )}
            </span>
          </div>
        ))}
    </ScrollableFeed>
  );
};

export default ScrollableChat