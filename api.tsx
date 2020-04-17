import firebase, { initializeDatabase } from './firebase/clientApp'

export async function getCompanies(search = null, recursive = false) {
  const end = search?.replace(/.$/, c => String.fromCharCode(c.charCodeAt(0) + 1));
  let companies = []
  async function companyHandler(snap) {
    let promises = snap.docs.map(async d => {
      let data = d.data()
      let industries = []
      if (recursive && data.industries) {
        let promises = data.industries.map(async ref =>
          await ref.get().then(res => res.data()))
        industries = await Promise.all(promises);
      }
      return { ...data, industries, id: d.id }
    })
    companies = await Promise.all(promises);
  }
  if (search) {
    await firebase.firestore().collection('companies').where('name', '>=', search).where('name', '<', end).get().then(companyHandler).catch(err => console.log(err))
  } else {
    await firebase.firestore().collection('companies').get().then(companyHandler).catch(err => console.log(err))
  }
  return companies;
} 