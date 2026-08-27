
export const getUserLocalRecord = (): number => {
    return Number(localStorage.getItem('67_user_points'))
}

export const setUserLocalRecord = (points: number) => {
    const currentRecord = getUserLocalRecord();

    if(points > currentRecord){
        return localStorage.setItem('67_user_points', String(points));
    }
}