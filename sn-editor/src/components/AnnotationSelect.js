import React from 'react'

const AnnotationSelect = ({allLabels, newlabelRef, newcolorRef, handleConfirm, selectedLabel, findSetSelectedLabel}) => {
    const [showNew,setShowNew] =React.useState(false)
    // const [selectedLabel, setSelectedLabel] = useState({label:"Bad",color:"#ff0000"});
    // const [allLabels,setLabels]= React.useState([{label:"Bad",color:"#ff0000"},{label:"Good",color:"#00ff00"}])
    // const newlabelRef = React.useRef(null)
    // const newcolorRef = React.useRef(null)
    const handleshownew = ()=>{
        setShowNew(!showNew)
    }
    // const handleConfirm = ()=>{
    //     if (newlabelRef.current.value.trim() === "") return
    //     setLabels([...allLabels,{label:newlabelRef.current.value,color:newcolorRef.current.value}])
    //     newlabelRef.current.value=""
    // }

  return (
    <div>
        <h4>Select Annotation</h4>
        <div>
            <select onChange={(e) => {findSetSelectedLabel(e.target.value)}}>
               {allLabels.map(element=>(
                <option style={{background:element.color}} value={element.label} label={element.label} />
               ))}
            </select>
        </div>
        <div>
            <button onClick={handleshownew}>Add Custom</button>
            {showNew && 
            <div >

                <input ref={newlabelRef} type="text" placeholder='label for Annotation' /><br />
                <input ref={newcolorRef} type="color"  /><br />

                <button onClick={handleConfirm}>Confirm</button>
            </div>}
        </div>
    </div>
  )
}

export default AnnotationSelect