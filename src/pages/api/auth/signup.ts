// import type { NextApiRequest, NextApiResponse } from 'next'
// import { createUserWithEmailAndPassword, getAuth } from 'firebase/auth';

 
// export default async function handler(
//   req: NextApiRequest,
//   res: NextApiResponse
// ) {
//   const auth = getAuth();
//   const { email, password } = req.body
//   createUserWithEmailAndPassword(auth, email, password)
//     .then((userCredential) => {
//       // Signed up 
//       const user = userCredential.user;
//       // ...
//     })
//     .catch((error) => {
//       const errorCode = error.code;
//       const errorMessage = error.message;
//       // ..
//     });
// }