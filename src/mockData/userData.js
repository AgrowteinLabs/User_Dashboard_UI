const userData = {
  name: 'Abhinav Bavos',
  email: 'abhinavbavos.2000@gmail.com',
  phone: '(+91) 960 50 90 656',
  location: 'Kanjirappally, Kottayam',
  joined: 'January 2024',
  bio: 'Agritech enthusiast, passionate about farming innovations.',
  interests: ['Agriculture', 'Hydroponics', 'IoT', 'Automation'],
  notifications: [
      {
          id: 1,
          type: 'info',
          message: 'Your profile has been updated successfully.',
          time: '2 minutes ago',
          read: false,
      },
      {
          id: 2,
          type: 'success',
          message: 'You have successfully completed the task.',
          time: '10 minutes ago',
          read: true,
      },
      {
          id: 3,
          type: 'error',
          message: 'There was an error processing your request.',
          time: '1 hour ago',
          read: false,
      },
      {
          id: 4,
          type: 'info',
          message: 'New features have been added to your dashboard.',
          time: '3 hours ago',
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
