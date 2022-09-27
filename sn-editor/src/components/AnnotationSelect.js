import React from 'react'

const AnnotationSelect = ({allLabels, newlabelRef, newcolorRef, handleConfirm, selectedLabel, findSetSelectedLabel}) => {
    const [showNew,setShowNew] = React.useState(false)

    const handleshownew = ()=>{
        setShowNew(!showNew)
    }

  return (
    <div>
        <h4>Select Annotation</h4>
        <div>
            <select onChange={(e) => {findSetSelectedLabel(e.target.value)}}  >
               {allLabels.map((element,i)=>(
                <option style={{background:element.color}} value={element.label} label={element.label} key={i} />
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