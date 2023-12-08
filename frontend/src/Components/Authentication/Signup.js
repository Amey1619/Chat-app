import { FormControl, FormLabel, VStack, Input, InputRightElement ,Button, InputGroup, useToast} from '@chakra-ui/react';
import React, { useState } from 'react'
import axios from "axios";
import {useHistory} from "react-router-dom";

const Signup = () => {
    const [name,setName]=useState();
    const [email,setEmail]=useState();
    const [confirmedpassword,setConfirmedpassword]=useState();
    const [password,setPassword]=useState();
    const [pic,setPic]=useState();
    const [loading,setLoading]=useState(false);
    const [show, setShow] = useState(false);
    const history= useHistory();

    const toast=useToast();

    const handleClick=()=> setShow(!show);
    
    const postDetails=(pics)=>{
      setLoading(true);
      if(pics===undefined){
        toast({
          title:"Please select add Avatar",
          status:"warning",
          duration: 5000,
          isClosable:true,
          position:"bottom",
        });
        return;
      }
      if(pics.type==="image/jpeg" || pics.type==="image/png"){
        const data=new FormData();
        data.append("file",pics);
        data.append("upload_preset","chats-app");
        data.append("cloud_name", "dx2c2nxsx");
        fetch("https://api.cloudinary.com/v1_1/dx2c2nxsx/image/upload", {
          method: "post",
          body: data,
        })
          .then((res) => res.json())
          .then((data) => {
            setPic(data.url.toString());
            setLoading(false);
          })
          .catch((err) => {
            console.log(err);
            setLoading(false);
          });
      }else{
        toast({
          title: "Please select an Image!",
          status:"warning",
          duration:5000,
          isClosable:true,
          position:"bottom",
        });
        setLoading(false);
        return;
      }
    };

    const submitHandeler= async ()=>{ 
      setLoading(true);
      if(!name || !email || !password || !confirmedpassword){
        toast({
          title:"Please Fill all the Fields",
          status: "warning",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
        setLoading(false);
        return;
      }
      try{
          const config={
            headers:{
              "Content-type":"application/json",
            },
          };
          const {data}=await axios.post("/api/user",{name,email,password,pic},config);
          toast({
            title: "Registration successfull",
            status: "success",
            duration: 5000,
            isClosable: true,
            position: "bottom",
          });
          localStorage.setItem('userInfo',JSON.stringify(data));
          setLoading(false);
          history.push('/chats')
      }
      catch (error) {
         toast({
           title: "Error Occured",
           description: error.response.data.message,
           status: "warning",
           duration: 5000,
           isClosable: true,
           position: "bottom",
         });
      };
     };
  return (
    <VStack spacing="5px">
      <FormControl id="first-name" color="black" isRequired>
        <FormLabel>Name</FormLabel>
        <Input
          placeholder="Enter Your Name"
          onChange={(e) => setName(e.target.value)}
        />
      </FormControl>

      <FormControl id="email" color="black" isRequired>
        <FormLabel>Email</FormLabel>
        <Input
          placeholder="Enter Your Email"
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormControl>
      <FormControl id="password" color="black" isRequired>
        <FormLabel>Password</FormLabel>
        <InputGroup size="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="Enter Your Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>
      <FormControl id="password" color="black" isRequired>
        <FormLabel>Confirm Password</FormLabel>
        <InputGroup side="md">
          <Input
            type={show ? "text" : "password"}
            placeholder="Confirm Password"
            onChange={(e) => setConfirmedpassword(e.target.value)}
          />
          <InputRightElement width="4.5rem">
            <Button h="1.75rem" size="sm" onClick={handleClick}>
              {show ? "Hide" : "Show"}
            </Button>
          </InputRightElement>
        </InputGroup>
      </FormControl>
      <FormControl>
        <FormLabel>Upload your picture</FormLabel>
        <Input type="file" p={1.5} accept="image/*" onChange={(e)=>postDetails(e.target.files[0])}/>
      </FormControl>

      <Button colorScheme='blue' width="100%" style={{marginTop:15}} onClick={submitHandeler} isLoading={loading}>
        SignUp
      </Button>
    </VStack>
  );
};

export default Signup