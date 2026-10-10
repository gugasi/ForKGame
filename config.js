// ✏️ EDIT ME — everything personal lives here.
window.DREAMHOUSE_CONFIG = {
  herName: "Kiu",             // used in the greeting for kiu
  herTitle: "Princess",       // shown before her name ("Welcome home, Princess Kiu"). Set "" to remove.
  fromName: "Guga",           // who the letters are from aka me duh

  // How often the Weasel Postman brings a free booster pack (in minutes). 360 = every 6 hours.
  // Up to 3 packs wait in the mailbag, and she can also buy packs with Data Cubes.
  packIntervalMinutes: 360,

  // Optional: live letters from a Google Sheet.
  // Sheet columns: date | title | message  (first row = headers)
  // File → Share → Publish to web → choose that sheet → CSV → paste the link here.
  // Letters below + letters from the sheet are combined. Only ever ADD rows (don't reorder or delete).
  // Leave "" to use only the letters below.
  sheetCsvUrl: "",

  letters: [
    {
      date: "Today",
      title: "Welcome home c:",
      body:
`Hi!

I built this little house for you. It doesn't have goals, scores, or deadlines.

I want this to be your comfort place no matter what kind of good or bad mood you are in, just know you can always come here to relax. When the day is loud, quiet, cold, messy, or even nice. Feel free to come sit in the lamp light, feed the ravioli pets,
or turn into a wet rat and nap in the trash can while u do ur ballerina moves. All are valid.

I'm proud of you. Always.

— Guga`
    }
  ],

  // Gentle romance picks that show up as "+ add" buttons on her Couch Cinema list.
  // ✏️ Swap these for things I know kiu might like (and hasn't seen yet).
  watchSuggestions: [
    { title: "Horimiya",                  note: "Sweet and cozy" },
    { title: "Teasing Master Takagi-san",  note: "Funny, romantic, pure:)" },
    { title: "Toradora!",                 note: "A classic romcom" },
    { title: "Kimi ni Todoke",            note: "Slow, soft and heart-melting" },
    { title: "Skip and Loafer",           note: "Gentle and wholesome" },
    { title: "Ride your wave",           note: "just full of emotions" },
    { title: "Grand blue Dreaming",      note: "for laughs and pervyness wink" },
    { title: "Mushishi",                 note: "Cozy yet dramatic adventures" },
    { title: "One week friends",         note: "really adorable:)" },
    { title: "K-ON",                     note: "fun girl squad starting a music band" },
    { title: "yuru camp or Laid-Back Camp",                     note: "most cozy animes about camping" },
    { title: "you and me",                     note: "my favorite guy friendship anime" },
    { title: "mob psycho 100",                     note: "very fun action cozy anime" },
    { title: "Natsume's book of friends",                     note: "One of my alltime favorite summer nostalgias" },
    { title: "Blood Blockade Battlefront",                     note: "cool crime fighting action anime" },
    { title: "Nana",                                          note: "one anime I recommend u a lot for romance,music,fashion,etc. just u ms drama" },
    { title: "Kiznaiver",                                          note: "pain and connection between individuals" },
    { title: "Super cub",                                          note: "havent watched but cool girls biking group" },
    { title: "Hyouka",                                          note: "teen detectives,drama,romance" },
    { title: "Tanaka-kun Is Always Listless",                                          note: "cute cozy high school life of a boy and his friends" },
    { title: "Silver Spoon",                                          note: "cozy farm life for teens" },
    { title: "Flying witch",                                          note: "haven't seen either but seems cozy witch girl with family" },
    { title: "Barakamon",                                          note: "Haven't seen but heard its really good adventure cozy anime of a guy and lil kid tagging along ehm ehm familiar" },
    { title: "Durarara",                                          note: "awesome drama,action in a city anime recommend it a lot lot" },
    { title: "Bungou stray dogs",                                          note: "one of my alltime favorite most poetically written animes all seasons are good and gets better and better" },
    { title: "Bungou stray dogs",                                          note: "one of my alltime favorite most poetically written animes all seasons are good and gets better and better" },
    { title: "Dandadan",                                          note: "DANDADANNNNNNN aliens,monsters,teens romance,EVERYTHINGGG awesome story,humor,art style,music recommend it a lot:)" },
    { title: "Tonikaku Kawaii",           note: "Pure newlywed fluff" }
  ],

  // Optional: your own "Royal Decrees" (short sweet lines). Leave [] to use the built-in ones.
  decrees: []
};
