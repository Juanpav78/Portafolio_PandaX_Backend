const generateId = ()=>{
    const rand = (Math.random()*5).toString(32).substring(2);
    const date = Date.now().toString(32);

    return rand + date;
}

export default generateId;