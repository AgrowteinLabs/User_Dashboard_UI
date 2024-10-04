const userData = {
  name: 'Abhinav Bavos',
  email: 'abhinavbavos.2000@gmail.com',
  phone: '(+91) 960 50 90 656',
  location: 'Kanjirappally, Kottayam',
  joined: 'January 2024',
  bio: 'Agritech enthusiast, passionate about farming innovations.',
  interests: ['Agriculture', 'Aquaponics', 'IoT', 'Automation'],
  notifications: [
      
      {
          id: 2,
          type: 'success',
          message: 'Logged in Succesfully.',
          read: false,
      },
      {
          id: 3,
          type: 'success',
          message: 'Profile Updated.',
          read: true,
      },
      {
          id: 4,
          type: 'success',
          message: 'Account Created Succesfully.',
          read: true,
      },
  ],
  products: [
      'Agventure',
      'Mushroom Farm Automation',
      'Aquaculture',
      'Greenhouse Automation',
      'Hydroponics Automation',
  ], // List of products assigned to the user
  sensors: [
      'currentWaterLevel',
      'currentPh',
      'last7DaysPh',
      'last7DaysWaterLevel',
      // Add more sensors as needed
  ],
};

export default userData;
