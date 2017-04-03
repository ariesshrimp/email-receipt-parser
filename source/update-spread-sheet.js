export const saveResults = (auth) => async (data) => {
  try {
    const status = data // await google sheets response code to see if save was a success
    return status
  } catch (e) {error(problem('saveResults failed', e))}
}
