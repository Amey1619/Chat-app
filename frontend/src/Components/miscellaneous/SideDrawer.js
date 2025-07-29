import {
  Box,
  Badge,
  Button,
  Tooltip,
  Text,
  MenuButton,
  useToast,
  Avatar,
  MenuItem,
  MenuDivider,
  Spinner,
} from "@chakra-ui/react";
import { Menu, Input } from "@chakra-ui/react";
import { MenuList } from "@chakra-ui/menu";
import { BellIcon, ChevronDownIcon, SearchIcon } from "@chakra-ui/icons";
import { useDisclosure } from "@chakra-ui/hooks";
import { useState, useCallback, useEffect } from "react";
import axios from "axios";
import { getSender } from "../../config/ChatLogics";
import { ChatState } from "../../Context/ChatProvider";
import UserListItem from "../UserAvatar/UserListItem";
import ChatLoading from "../ChatLoading";
import ProfileModal from "./ProfileModal";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import {
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
} from "@chakra-ui/modal";
import { debounce } from "lodash";

const SideDrawer = () => {
  const [search, setSearch] = useState("");
  const [searchResult, setSearchResult] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const history = useHistory();
  const {
    user,
    setSelectedChat,
    chats,
    setChats,
    notification,
    setNotification,
  } = ChatState();

  const toast = useToast();
  const { onOpen, onClose, isOpen } = useDisclosure();

  // Auto-search function with 3-second delay
  const autoSearch = useCallback(
    debounce(async (searchTerm) => {
      if (searchTerm.trim() === "") {
        setSearchResult([]);
        setIsTyping(false);
        return;
      }

      setLoading(true);
      setIsTyping(false);

      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };

        const { data } = await axios.get(
          `/api/user?search=${encodeURIComponent(searchTerm)}`,
          config
        );

        setSearchResult(data);

        // Show helpful message if no results found
        if (data.length === 0) {
          toast({
            title: "No users found",
            description: `No users found matching "${searchTerm}". Try a different search term.`,
            status: "info",
            duration: 3000,
            isClosable: true,
            position: "bottom-left",
          });
        }
      } catch (error) {
        console.error("Search failed:", error);
        toast({
          title: "Search Error",
          description:
            error.response?.data?.message ||
            "Failed to search users. Please try again.",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom-left",
        });
        setSearchResult([]);
      } finally {
        setLoading(false);
      }
    }, 3000), // 3 second delay as requested
    [user.token, toast]
  );

  // Auto-trigger search when user stops typing for 3 seconds
  useEffect(() => {
    if (search.trim()) {
      setIsTyping(true);
      autoSearch(search);
    } else {
      setSearchResult([]);
      setIsTyping(false);
      autoSearch.cancel();
    }

    // Cleanup function
    return () => {
      autoSearch.cancel();
    };
  }, [search, autoSearch]);

  // Handle input change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);

    // Clear results immediately when input is cleared
    if (value.trim() === "") {
      setSearchResult([]);
      setIsTyping(false);
    }
  };

  // Handle Enter key press for immediate search (bypasses 3-second delay)
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && search.trim()) {
      autoSearch.cancel(); // Cancel the 3-second delay
      setIsTyping(false);
      handleSearch(); // Immediate search
    }
  };

  // Manual search button handler (immediate search)
  const handleSearch = async () => {
    if (!search.trim()) {
      toast({
        title: "Search Required",
        description: "Please enter a name or email to search",
        status: "warning",
        duration: 3000,
        isClosable: true,
        position: "top-left",
      });
      return;
    }

    // Cancel auto-search and perform immediate search
    autoSearch.cancel();
    setLoading(true);

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };
      const { data } = await axios.get(
        `/api/user?search=${encodeURIComponent(search)}`,
        config
      );

      setSearchResult(data);

      if (data.length === 0) {
        toast({
          title: "No results",
          description: `No users found for "${search}"`,
          status: "info",
          duration: 3000,
          isClosable: true,
          position: "bottom-left",
        });
      }
    } catch (error) {
      console.error("Search error:", error);
      toast({
        title: "Search Failed",
        description: error.response?.data?.message || "Failed to search users",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    } finally {
      setLoading(false);
    }
  };

  // Access chat function
  const accessChat = async (userId) => {
    try {
      setLoadingChat(true);

      const config = {
        headers: {
          "Content-type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.post("/api/chat", { userId }, config);

      // Add chat to list if not already present
      if (!chats.find((c) => c._id === data._id)) {
        setChats([data, ...chats]);
      }

      setSelectedChat(data);
      setLoadingChat(false);

      // Clear search and close drawer
      setSearch("");
      setSearchResult([]);
      onClose();

      toast({
        title: "Chat opened",
        description: `Started chat with ${
          data.users.find((u) => u._id !== user._id)?.name
        }`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "bottom-right",
      });
    } catch (error) {
      console.error("Error accessing chat:", error);
      setLoadingChat(false);
      toast({
        title: "Failed to open chat",
        description: error.response?.data?.message || "Could not start chat",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom-left",
      });
    }
  };

  // Logout handler
  const logoutHandler = () => {
    localStorage.removeItem("userInfo");
    history.push("/");
  };

  // Handle notification read
  const handleReadNotification = async (notifId) => {
    try {
      await axios.delete(`/api/notifs/${notifId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setNotification(notification.filter((n) => n._id !== notifId));
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  // Clear search when drawer closes
  const handleDrawerClose = () => {
    setSearch("");
    setSearchResult([]);
    setIsTyping(false);
    autoSearch.cancel();
    onClose();
  };

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        bg="white"
        w="100%"
        p="5px 10px 5px 10px"
        borderWidth="5px"
      >
        <Tooltip
          label="Search users to chat with"
          hasArrow
          placement="bottom-end"
        >
          <Button variant="ghost" onClick={onOpen} leftIcon={<SearchIcon />}>
            <Text d={{ base: "none", md: "flex" }} px={2}>
              Search User
            </Text>
          </Button>
        </Tooltip>

        <Text fontSize="2xl" fontFamily="Work sans" fontWeight="bold">
          Talk-A-Tive
        </Text>

        <div>
          {/* Notifications Menu */}
          <Menu>
            <MenuButton p={1}>
              <Box position="relative" display="inline-block">
                <BellIcon fontSize="2xl" m={1} />
                {notification.length > 0 && (
                  <Badge
                    position="absolute"
                    top="-1"
                    right="-1"
                    bg="red.500"
                    color="white"
                    borderRadius="full"
                    px="2"
                    fontSize="0.7em"
                    zIndex="1"
                  >
                    {notification.length}
                  </Badge>
                )}
              </Box>
            </MenuButton>
            <MenuList pl={2}>
              {!notification.length && (
                <Text p={2} color="gray.500">
                  No New Messages
                </Text>
              )}
              {notification.map((notif) => (
                <MenuItem
                  key={notif._id}
                  onClick={() => {
                    setSelectedChat(notif.chat);
                    setNotification(notification.filter((n) => n !== notif));
                    handleReadNotification(notif._id);
                  }}
                >
                  {notif.chat.isGroupChat
                    ? `New Message in ${notif.chat.chatName}`
                    : `New Message from ${getSender(user, notif.chat.users)}`}
                </MenuItem>
              ))}
            </MenuList>
          </Menu>

          {/* Profile Menu */}
          <Menu>
            <MenuButton as={Button} bg="white" rightIcon={<ChevronDownIcon />}>
              <Avatar
                size="sm"
                cursor="pointer"
                name={user.name}
                src={user.pic}
              />
            </MenuButton>
            <MenuList>
              <ProfileModal user={user}>
                <MenuItem>My Profile</MenuItem>
              </ProfileModal>
              <MenuDivider />
              <MenuItem onClick={logoutHandler}>Logout</MenuItem>
            </MenuList>
          </Menu>
        </div>
      </Box>

      {/* Search Drawer */}
      <Drawer
        placement="left"
        onClose={handleDrawerClose}
        isOpen={isOpen}
        size="md"
      >
        <DrawerOverlay />
        <DrawerContent>
          <DrawerHeader borderBottomWidth="1px" pb={4}>
            <Text fontSize="lg" fontWeight="bold">
              Search Users
            </Text>
          </DrawerHeader>

          <DrawerBody>
            {/* Search Input Section */}
            <Box display="flex" pb={4} gap={2}>
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={handleSearchChange}
                onKeyDown={handleKeyPress}
                size="md"
                focusBorderColor="blue.400"
                bg="gray.50"
                _hover={{ bg: "white" }}
                _focus={{ bg: "white" }}
              />
              <Button
                onClick={handleSearch}
                colorScheme="blue"
                isLoading={loading}
                loadingText="Searching"
                size="md"
                minW="70px"
              >
                Go
              </Button>
            </Box>

            {/* Search Status */}
            {isTyping && (
              <Box display="flex" alignItems="center" mb={2}>
                <Spinner size="sm" color="blue.500" mr={2} />
                <Text fontSize="sm" color="blue.500">
                  Searching...
                </Text>
              </Box>
            )}

            {search.trim() && !loading && !isTyping && (
              <Text fontSize="sm" color="gray.600" mb={3}>
                {searchResult.length > 0
                  ? `Found ${searchResult.length} user${
                      searchResult.length !== 1 ? "s" : ""
                    } matching "${search}"`
                  : `No users found for "${search}"`}
              </Text>
            )}

            {/* Search Results */}
            <Box>
              {loading ? (
                <Box
                  display="flex"
                  justifyContent="center"
                  alignItems="center"
                  py={8}
                >
                  <ChatLoading />
                </Box>
              ) : search.trim() === "" ? (
                <Box textAlign="center" py={8}>
                  <SearchIcon fontSize="3xl" color="gray.400" mb={3} />
                  <Text color="gray.500" fontSize="md">
                    Find friends by name or email
                  </Text>
                </Box>
              ) : searchResult.length === 0 ? (
                <Box textAlign="center" py={8}>
                  <Text color="gray.500" fontSize="md">
                    No users found matching "{search}"
                  </Text>
                  <Text color="gray.400" fontSize="sm" mt={2}>
                    Try searching with a different name or email
                  </Text>
                </Box>
              ) : (
                <Box>
                  {searchResult.map((searchUser, index) => (
                    <Box key={searchUser._id} mb={2}>
                      <UserListItem
                        user={searchUser}
                        handleFunction={() => accessChat(searchUser._id)}
                      />
                      {index < searchResult.length - 1 && (
                        <Box borderBottom="1px" borderColor="gray.200" my={2} />
                      )}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>

            {/* Loading Chat Indicator */}
            {loadingChat && (
              <Box
                display="flex"
                justifyContent="center"
                alignItems="center"
                mt={4}
                p={4}
                bg="blue.50"
                borderRadius="md"
              >
                <Spinner size="md" color="blue.500" mr={3} />
                <Text color="blue.600" fontWeight="medium">
                  Opening chat...
                </Text>
              </Box>
            )}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default SideDrawer;
