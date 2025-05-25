'use client'
import { useState } from "react";
import Image from "next/image";
import {assets} from "@/assets/assets"
import Sidebar from "@/components/Sidebar";
import PromptBox from "@/components/PromptBox";
import Messages from "@/components/Messages";

export default function Home() {
  const [expand, setExpand] =useState(false)
  const [messages, setMessages] = useState([])
  const [isLoading, setIsLoading]= useState(false)

  return (
    <div>
      <div className="flex h-screen">
        <Sidebar expand={expand} setExpand={setExpand}/>
        {/* sidebar */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8 bg-[#292a2d] text-white relative">
          <div className="md:hidden absolute px-4 top-6 flex items-center justify-between w-full">
            <Image onClick={()=>(expand? setExpand(false): setExpand(true))} className="rotate-180" src={assets.menu_icon} alt={""}/>
            <Image className="opacity-70" src={assets.chat_icon} alt={""}/>
          </div>

          {messages.length === 0 ? (
            <>
            <div className="flex items-center gap-3">
              <Image src={assets.logo_icon} alt="" className="h-16 w-auto transform scale-110"/>
              <p className="text-2xl font-medium">Hey Prabal, BroBot here!</p>
            </div>
              <p className="text-md mt-2 text-center">What are you curious about now?</p>
            </>
          ):(
            <div>
              <Messages role='user' content='What is Next js'/>
            </div>
          )}
         <PromptBox isLoading={isLoading} setIsLoading={setIsLoading}/>
         <p className="text-xs absolute bottom-1 text-gray-500">I am an AI not Human, So you can trust me!!</p>
        </div>
      </div>
    </div>
  );
}
