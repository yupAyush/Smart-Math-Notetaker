"use client"
import React, { useEffect, useRef ,useState } from 'react'

import { ColorSwatch,Group } from '@mantine/core';
import axios from 'axios';

function page() {
  interface response {
    expr:string,
    result:string,
    assign:boolean,

  }

  interface generatedResult {
    expression:string,
    ans:string,
  }


  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setisDrawing] = useState<boolean>(false);
  const [color, setColor]=useState('rgb(255,255,255)')
  const [reset, setreset] = useState(false);
  const [result, setresult] = useState<generatedResult>();
  const [listofvar, setlistofvar] = useState({});
  const [state, setstate] = useState(0);
  
  const resultRef = useRef<HTMLHeadingElement | null>(null);


  const  SWATCHES = [
    "#ffffff", // white
    "#ee3333", // red
    "#e64980", // pink
    "#be4bdb", // purple
    "#893200", // brown
    "#228be6", // blue
    "#3333ee", // dark blue
    "#40c057", // green
    "#00aa00", // dark green
    "#fab005", // yellow
    "#fd7e14"  // orange
];

  useEffect(() => {

    if(reset){
      resetCanvas();
      setreset(false);
      setstate(0)

    }

    
   
  }, [reset]);
  

  useEffect(() => {
    const canvas = canvasRef.current;
    if(canvas){
      const ctx = canvas.getContext("2d")
      canvas.style.background='black';
      if(ctx){
        canvas.width=window.innerWidth;
        canvas.height=window.innerHeight-canvas.offsetTop;
        ctx.lineWidth=3
        ctx.lineCap='round'
      }
    }
   
  }, []); // assigning intial values to canvas


  const resetCanvas =()=>{
    const canvas  = canvasRef.current;
    if(canvas){
      const ctx = canvas.getContext("2d");
      if(ctx){
        ctx.clearRect(0,0,canvas.width,canvas.height)
      }

    }

  }

  const startDrawing =(e:React.MouseEvent<HTMLCanvasElement>)=>{
    const canvas = canvasRef.current;
    if(canvas){
      
      const ctx = canvas.getContext('2d');
      if(ctx){
        ctx.beginPath(); // new drawing 
        ctx.moveTo(e.nativeEvent.offsetX,e.nativeEvent.offsetY) // moves to that point where our cursor is 
        setisDrawing(true);

      }
    }

  }

  const stopDrawing =()=>{
    setisDrawing(false);
  }

  const draw = (e:React.MouseEvent<HTMLCanvasElement>)=>{
    if(!isDrawing){
      return;
    }

    const canvas= canvasRef.current;
    if(canvas){
      const ctx =  canvas.getContext("2d")
      if(ctx) {
        ctx.strokeStyle=color;
        ctx.lineTo(e.nativeEvent.offsetX,e.nativeEvent.offsetY);
        
        const resRef = resultRef.current;
        if(resRef){
          
          resRef.style.top = `${e.nativeEvent.offsetY-80}px`;
          resRef.style.left = `${e.nativeEvent.offsetX+40}px`;
          resRef.style.color=color
        }

        ctx.stroke()


      }
      
    }


  }

  const calRes = async ()=>{
    const canvas = canvasRef.current;
    if(canvas){
      try {
       let dataArray =[]
       const response = await axios.post('/api/calculate',{img:canvas.toDataURL('image/png')})
       console.log(response.data.text)
       const matches = response.data.text.match(/\{[^{}]*\}/g);
       console.log(JSON.parse(matches[matches.length-1]).result)
       setstate(JSON.parse(matches[matches.length-1]).result)
       
      } catch (error) {
        console.log("couldnt send the")
        
      }
    }
  }
  
  return (
    <>
      <div className='flex z-20 justify-between items-center'>
        
        <button onClick={()=>setreset(true)} className='bg-green-500 hover:bg-green-400 text-white font-bold py-2 z-20 m-3 px-4 border-b-4 border-green-700 hover:border-green-500 rounded'>Reset</button>
        <Group className='z-20  flex items-center justify-between ' gap="xs">
        {SWATCHES.map((swatchColor:string)=>{
          return (< ColorSwatch
          key={swatchColor}
          color={swatchColor}
          onClick={()=>setColor(swatchColor)}
          style={{backgroundColor: swatchColor, cursor: 'pointer' }}
          size={28}
          className='w-7 h-7 rounded-full border-2 hover:w-8'
          />)
        })}</Group>
        <button onClick={calRes} className='bg-yellow-500 hover:bg-yellow-400 text-white font-bold py-2 z-20 m-3 px-4 border-b-4 border-yellow-700 hover:border-yellow-500 rounded
         '>Calculate</button>

      </div>
      <canvas ref={canvasRef} className='absolute top-0 left-0 z-10 w-full h-full' id='canvas' onMouseDown={startDrawing} onMouseOut={stopDrawing} onMouseUp={stopDrawing} onMouseMove={draw}>
      </canvas>
      <h1 ref={resultRef} className="absolute top-10 left-10 font-sans text-white text-9xl font-light z-20">
        {state === 0 ? "" : state}
      </h1>

      
    </>
  )
}

export default page
