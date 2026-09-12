require('dotenv').config();
const mongoose = require('mongoose');
const Team = require('./models/Team');
const Player = require('./models/Player');
const AuctionSet = require('./models/AuctionSet');
const AuctionLog = require('./models/AuctionLog');
const AuctionState = require('./models/AuctionState');
const { getBasePriceForYear } = require('./utils/economy');
const fs = require('fs');
const path = require('path');

const MONGO_URI = process.env.MONGO_URI;
if (!MONGO_URI) {
  throw new Error('MONGO_URI is required. Set it in backend/.env before running the seed script.');
}

const teamsData = [
  {
    name: 'Aryabhatta Titans',
    shortCode: 'ABT',
    primaryColor: '#06B6D4', // Cyan
    secondaryColor: '#083344',
    totalPurse: 100,
    remainingPurse: 100,
    owner: 'Prof. S. Sen & Kabir Verma',
    captain: 'Kabir Verma (Room 312)',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=AryabhattaTitans&backgroundColor=083344',
  },
  {
    name: 'Bhabha Blasters',
    shortCode: 'BBL',
    primaryColor: '#F59E0B', // Amber/Gold
    secondaryColor: '#451A03',
    totalPurse: 100,
    remainingPurse: 100,
    owner: 'Hostel 4 Council',
    captain: 'Arjun Mehra (Room 108)',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=BhabhaBlasters&backgroundColor=451A03',
  },
  {
    name: 'Charaka Cheetahs',
    shortCode: 'CCH',
    primaryColor: '#10B981', // Emerald
    secondaryColor: '#064E3B',
    totalPurse: 100,
    remainingPurse: 100,
    owner: 'Mess Committee Group',
    captain: 'Rohan Sharma (Room 420)',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=CharakaCheetahs&backgroundColor=064E3B',
  },
  {
    name: 'Drona Dominators',
    shortCode: 'DDM',
    primaryColor: '#EC4899', // Pink
    secondaryColor: '#500724',
    totalPurse: 100,
    remainingPurse: 100,
    owner: 'Sports Club Alumni',
    captain: 'Devendra Nair (Room 215)',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=DronaDominators&backgroundColor=500724',
  },
  {
    name: 'Eklavya Enforcers',
    shortCode: 'EEN',
    primaryColor: '#8B5CF6', // Purple
    secondaryColor: '#2E1065',
    totalPurse: 100,
    remainingPurse: 100,
    owner: 'Tech Council Syndicate',
    captain: 'Tanmay Saxena (Room 114)',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=EklavyaEnforcers&backgroundColor=2E1065',
  },
  {
    name: 'Gargi Gladiators',
    shortCode: 'GGL',
    primaryColor: '#EF4444', // Red
    secondaryColor: '#450A0A',
    totalPurse: 100,
    remainingPurse: 100,
    owner: 'Hostel 7 Seniors',
    captain: 'Sameer Siddiqui (Room 304)',
    logo: 'https://api.dicebear.com/7.x/identicon/svg?seed=GargiGladiators&backgroundColor=450A0A',
  },
];

const setsData = [
  { name: 'Set 1: Marquee All-Stars', order: 1, description: 'Tournament MVPs and premier all-rounders' },
  { name: 'Set 2: Power Hitters & Top Order', order: 2, description: 'Explosive top-order bats and finishers' },
  { name: 'Set 3: Express Pace & Mystery Spin', order: 3, description: 'Death-overs specialists and wicket takers' },
  { name: 'Set 4: Wicket-keepers & Emerging Stars', order: 4, description: 'Glovemen and promising freshers' },
];

const playersData = [
  // Set 1: Marquee All-Stars
  {
    name: 'Aakash "Sniper" Rao',
    role: 'All-rounder',
    year: '4th',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Aryabhatta', block: 'B', room: '312', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Fast', matches: 28, runs: 680, wickets: 34, strikeRate: 168.4, economy: 6.8, specialSkill: 'Clutch Super-Over Specialist' },
    setIndex: 0,
  },
  {
    name: 'Vikramaditya Chawla',
    role: 'Batter',
    year: '4th',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Bhabha', block: 'A', room: '204', battingStyle: 'Left Hand Bat', bowlingStyle: 'Right Arm Off Break', matches: 32, runs: 940, wickets: 8, strikeRate: 154.2, economy: 7.9, specialSkill: 'Boundary magnet inside Powerplay' },
    setIndex: 0,
  },
  {
    name: 'Karthik "Yorker" Iyer',
    role: 'Bowler',
    year: '3rd',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Charaka', block: 'C', room: '110', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Express', matches: 24, runs: 120, wickets: 41, strikeRate: 110.0, economy: 5.9, specialSkill: 'Toe-crushing death yorkers' },
    setIndex: 0,
  },
  {
    name: 'Hardik Singh Oberoi',
    role: 'All-rounder',
    year: '3rd',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Drona', block: 'D', room: '419', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Medium', matches: 22, runs: 490, wickets: 22, strikeRate: 172.5, economy: 7.4, specialSkill: 'Helicopter shot finisher' },
    setIndex: 0,
  },
  {
    name: 'Pranav Shirodkar',
    role: 'Wicket-keeper',
    year: '4th',
    photo: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Eklavya', block: 'A', room: '301', battingStyle: 'Right Hand Bat', bowlingStyle: 'None', matches: 30, runs: 710, wickets: 0, strikeRate: 142.1, economy: 0, specialSkill: 'Lightning fast stumpings & DRS reader' },
    setIndex: 0,
  },
  {
    name: 'Zeeshan Khan',
    role: 'All-rounder',
    year: '3rd',
    photo: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Gargi', block: 'B', room: '105', battingStyle: 'Left Hand Bat', bowlingStyle: 'Slow Left Arm Orthodox', matches: 25, runs: 530, wickets: 29, strikeRate: 148.8, economy: 6.2, specialSkill: 'Middle overs squeeze' },
    setIndex: 0,
  },

  // Set 2: Power Hitters & Top Order
  {
    name: 'Rishi "Thunder" Kapoor',
    role: 'Batter',
    year: '2nd',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Aryabhatta', block: 'A', room: '102', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Leg Break', matches: 16, runs: 420, wickets: 4, strikeRate: 162.0, economy: 8.5, specialSkill: 'Spin-destroyer in middle overs' },
    setIndex: 1,
  },
  {
    name: 'Dhruv Tejwani',
    role: 'Batter',
    year: '1st',
    photo: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Freshers Hostel', block: 'F1', room: '202', battingStyle: 'Left Hand Bat', bowlingStyle: 'Right Arm Medium', matches: 8, runs: 280, wickets: 2, strikeRate: 155.5, economy: 8.0, specialSkill: 'U-19 State opening prodigy' },
    setIndex: 1,
  },
  {
    name: 'Ayush "Boom" Rawat',
    role: 'Batter',
    year: '3rd',
    photo: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Bhabha', block: 'C', room: '315', battingStyle: 'Right Hand Bat', bowlingStyle: 'None', matches: 19, runs: 510, wickets: 0, strikeRate: 178.2, economy: 0, specialSkill: 'Longest six in hostel tournament (104m)' },
    setIndex: 1,
  },
  {
    name: 'Neel Roy Chowdhury',
    role: 'Batter',
    year: '2nd',
    photo: 'https://images.unsplash.com/photo-1496345875659-11f7dd282d1d?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Charaka', block: 'B', room: '221', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Off Break', matches: 14, runs: 330, wickets: 3, strikeRate: 139.5, economy: 7.2, specialSkill: 'Anchor innings maestro' },
    setIndex: 1,
  },
  {
    name: 'Siddhant Joshi',
    role: 'Batter',
    year: '4th',
    photo: 'https://images.unsplash.com/photo-1480429370139-e0132c086e2a?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Drona', block: 'A', room: '402', battingStyle: 'Left Hand Bat', bowlingStyle: 'None', matches: 27, runs: 790, wickets: 0, strikeRate: 144.0, economy: 0, specialSkill: 'Reliable under high pressure chase' },
    setIndex: 1,
  },
  {
    name: 'Harshvardhan Rana',
    role: 'Batter',
    year: '1st',
    photo: 'https://images.unsplash.com/photo-1501196354995-cbb51c65aaea?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Freshers Hostel', block: 'F2', room: '118', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Medium', matches: 10, runs: 245, wickets: 1, strikeRate: 149.0, economy: 7.8, specialSkill: 'Aggressive 360-degree scoop shots' },
    setIndex: 1,
  },

  // Set 3: Express Pace & Mystery Spin
  {
    name: 'Varun "Mystery" Shenoy',
    role: 'Bowler',
    year: '2nd',
    photo: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Eklavya', block: 'B', room: '211', battingStyle: 'Right Hand Bat', bowlingStyle: 'Carrom Ball & Googly', matches: 18, runs: 65, wickets: 31, strikeRate: 95.0, economy: 5.6, specialSkill: 'Unpickable carrom ball & slider' },
    setIndex: 2,
  },
  {
    name: 'Taranjeet "Bullet" Gill',
    role: 'Bowler',
    year: '3rd',
    photo: 'https://images.unsplash.com/photo-1519764622345-23439dd774f7?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Aryabhatta', block: 'C', room: '409', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Fast (135+ kph)', matches: 20, runs: 85, wickets: 33, strikeRate: 105.0, economy: 6.9, specialSkill: 'Fierce bouncers with steep bounce' },
    setIndex: 2,
  },
  {
    name: 'Gaurav Mukherjee',
    role: 'Bowler',
    year: '4th',
    photo: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Bhabha', block: 'B', room: '112', battingStyle: 'Left Hand Bat', bowlingStyle: 'Left Arm Fast Swing', matches: 29, runs: 110, wickets: 38, strikeRate: 112.0, economy: 6.4, specialSkill: 'Late inward swing against right-handers' },
    setIndex: 2,
  },
  {
    name: 'Manish "Chahal" Soni',
    role: 'Bowler',
    year: '1st',
    photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Freshers Hostel', block: 'F1', room: '310', battingStyle: 'Right Hand Bat', bowlingStyle: 'Leg Break & Flipper', matches: 9, runs: 30, wickets: 17, strikeRate: 80.0, economy: 6.1, specialSkill: 'Bravery to flight the ball in death overs' },
    setIndex: 2,
  },
  {
    name: 'Aditya "Knuckle" Kulkarni',
    role: 'Bowler',
    year: '2nd',
    photo: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Charaka', block: 'A', room: '304', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Medium Knuckleball', matches: 15, runs: 45, wickets: 21, strikeRate: 98.0, economy: 6.7, specialSkill: 'Disguised slower bouncer' },
    setIndex: 2,
  },
  {
    name: 'Suhas Reddy',
    role: 'Bowler',
    year: '3rd',
    photo: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Gargi', block: 'C', room: '206', battingStyle: 'Right Hand Bat', bowlingStyle: 'Off-spinner & Doosra', matches: 21, runs: 95, wickets: 26, strikeRate: 118.0, economy: 6.5, specialSkill: 'Restricts batsmen inside 6 overs' },
    setIndex: 2,
  },

  // Set 4: Wicket-keepers & Emerging Stars
  {
    name: 'Ishaan "Thala" Saxena',
    role: 'Wicket-keeper',
    year: '2nd',
    photo: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Drona', block: 'B', room: '120', battingStyle: 'Right Hand Bat', bowlingStyle: 'None', matches: 17, runs: 390, wickets: 0, strikeRate: 151.0, economy: 0, specialSkill: 'No-look run-outs & Dhoni style whip' },
    setIndex: 3,
  },
  {
    name: 'Tanmay Bhatnagar',
    role: 'Wicket-keeper',
    year: '1st',
    photo: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Freshers Hostel', block: 'F2', room: '214', battingStyle: 'Left Hand Bat', bowlingStyle: 'None', matches: 8, runs: 210, wickets: 0, strikeRate: 138.0, economy: 0, specialSkill: 'Pinch hitter opener' },
    setIndex: 3,
  },
  {
    name: 'Abhishek "Rocket" Pillai',
    role: 'All-rounder',
    year: '1st',
    photo: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Freshers Hostel', block: 'F1', room: '109', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Fast', matches: 7, runs: 165, wickets: 11, strikeRate: 165.0, economy: 7.1, specialSkill: 'Best fielder award winner 2026' },
    setIndex: 3,
  },
  {
    name: 'Chirag "Spin King" Dave',
    role: 'All-rounder',
    year: '2nd',
    photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Eklavya', block: 'C', room: '102', battingStyle: 'Right Hand Bat', bowlingStyle: 'Leg Spin', matches: 14, runs: 220, wickets: 19, strikeRate: 135.0, economy: 6.8, specialSkill: 'Googly trap specialist' },
    setIndex: 3,
  },
  {
    name: 'Raghavan Swaminathan',
    role: 'Batter',
    year: '2nd',
    photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Charaka', block: 'D', room: '318', battingStyle: 'Right Hand Bat', bowlingStyle: 'None', matches: 12, runs: 290, wickets: 0, strikeRate: 141.0, economy: 0, specialSkill: 'Finishes with high boundary percentage' },
    setIndex: 3,
  },
  {
    name: 'Omkar Deshmukh',
    role: 'Bowler',
    year: '1st',
    photo: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
    stats: { hostel: 'Freshers Hostel', block: 'F2', room: '308', battingStyle: 'Right Hand Bat', bowlingStyle: 'Right Arm Medium Outswing', matches: 6, runs: 20, wickets: 9, strikeRate: 75.0, economy: 6.3, specialSkill: 'Unbeaten seam movement in morning games' },
    setIndex: 3,
  },
];

async function seed() {
  try {
    console.log('Connecting to MongoDB at:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('Connected! Purging old data...');

    await Promise.all([
      Team.deleteMany({}),
      Player.deleteMany({}),
      AuctionSet.deleteMany({}),
      AuctionLog.deleteMany({}),
      AuctionState.deleteMany({}),
    ]);

    console.log('Creating Teams...');
    const createdTeams = await Team.insertMany(teamsData);
    console.log(`Created ${createdTeams.length} Teams.`);

    console.log('Creating Auction Sets...');
    const createdSets = await AuctionSet.insertMany(setsData);
    console.log(`Created ${createdSets.length} Auction Sets.`);

    console.log('Creating Players with auto-derived base price by year...');
    const playerDocs = playersData.map((p, idx) => {
      const targetSet = createdSets[p.setIndex];
      const basePrice = getBasePriceForYear(p.year);
      return {
        ...p,
        set: targetSet._id,
        basePrice,
        status: 'pending',
        auctionOrder: idx + 1,
      };
    });

    const createdPlayers = await Player.insertMany(playerDocs);
    console.log(`Created ${createdPlayers.length} Players.`);

    // Attach players back to their respective Sets
    for (let i = 0; i < createdSets.length; i++) {
      const setPlayers = createdPlayers
        .filter((_, idx) => playersData[idx].setIndex === i)
        .map((p) => p._id);
      await AuctionSet.findByIdAndUpdate(createdSets[i]._id, {
        players: setPlayers,
      });
    }

    // Initialize Auction State with Set 1
    const firstSet = createdSets[0];
    const firstPlayer = createdPlayers[0];
    await AuctionState.create({
      activeSet: firstSet._id,
      currentPlayer: firstPlayer._id,
      currentBid: firstPlayer.basePrice,
      leadingTeam: null,
      bidHistory: [],
      status: 'bidding',
    });
    await Player.findByIdAndUpdate(firstPlayer._id, { status: 'in_progress' });
    await AuctionSet.findByIdAndUpdate(firstSet._id, { status: 'active' });

    // Initial audit log
    await AuctionLog.create({
      actionType: 'set_started',
      newValue: { setId: firstSet._id, setName: firstSet.name },
      details: 'Tournament Auction Initialized: Set 1 Marquee All-Stars on the block!',
    });

    // Also generate sample_players.csv for Admin bulk import test
    const csvContent = [
      'name,role,year,basePrice,set,hostel,block,room,battingStyle,bowlingStyle,matches,runs,wickets,strikeRate,economy,specialSkill,photo',
      'Manan "Sixer" Vora,Batter,1st,,Freshers Pool,Freshers,F1,101,Right Hand Bat,None,5,180,0,160.0,0,Upper cut sixes,https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      'Kunal "Slinger" Patel,Bowler,2nd,,Freshers Pool,Aryabhatta,A,114,Right Hand Bat,Right Arm Sling,12,30,18,90.0,6.2,Lasith Malinga action,https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      'Shaurya Singhania,All-rounder,3rd,,Freshers Pool,Drona,C,205,Left Hand Bat,Right Arm Medium,16,340,14,145.0,7.3,Top order counter-attacker,https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&w=400&q=80',
      'Yuvraj Chawla,Wicket-keeper,4th,,Freshers Pool,Bhabha,B,312,Right Hand Bat,None,22,510,0,135.0,0,Lightning glove work,https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
    ].join('\n');

    fs.writeFileSync(path.join(__dirname, 'sample_players.csv'), csvContent);
    console.log('Created sample_players.csv for bulk-importing.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
}

seed();
