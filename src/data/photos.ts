// Verified Unsplash stand-ins (free Unsplash licence, non-plus). Each portrait2 is the same person from the same photographer.
export type Photo = { url: string; alt: string; by?: string }

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&q=80&auto=format&fit=crop`
const ph = (id: string, alt: string, by: string): Photo => ({ url: u(id), alt, by })

export const PHOTOS: Record<string, { portrait: Photo; portrait2?: Photo; world: Photo[] }> = {
  kabir: {
    portrait: ph('1729157659231-a9090b02987a', 'Bearded man in a white shirt in a softly lit hallway', 'Sanju Pandita'),
    portrait2: ph('1729157661483-ed21901ed892', 'The same man, arms crossed, leaning on the hallway wall', 'Sanju Pandita'),
    world: [
      ph('1599420186985-5c3d1a038e84', 'Architectural floor-plan sketches and pens on a desk', 'Ryan Ancill'),
      ph('1631454965644-00510875561f', 'White architectural model of a modern house', 'Marsumilae'),
      ph('1698248476376-f28f8869b622', 'Row of brownstones with iron-railed stoops', 'Santeri'),
    ],
  },
  julien: {
    portrait: ph('1704726135027-9c6f034cfa41', 'Man in a linen shirt at a wooden table with a teacup, window light', 'Pavel Kosov'),
    world: [
      ph('1604543456734-4559dd906a0c', 'Chef’s knife and sliced cucumber on a wooden board', 'Kevin Doran'),
      ph('1591586116988-62fe65164f8d', 'Radishes, carrots and cauliflower at a farmers market', 'Shelley Pauls'),
      ph('1512284125381-bdb1f3a77338', 'Notebook with a coffee ring on a dark wood table', 'Markus Spiske'),
    ],
  },
  marcus: {
    portrait: ph('1645736594095-b9a4cabc1a7c', 'Man with round glasses in a floral shirt against a dark backdrop', 'Dellon Thomas'),
    portrait2: ph('1645736593932-2c877741fd6c', 'The same man in a suit and tie, adjusting his watch', 'Dellon Thomas'),
    world: [
      ph('1632008341003-5c6767c7d237', 'Piano keys in low light', 'Tyler Clemmensen'),
      ph('1789815010750-09a46d609d37', 'Grand piano and microphone on an empty jazz stage', 'Jon Tyson'),
      ph('1603058817990-2b9a9abbce86', 'Shelves of bound law reference volumes', 'Eilis Garvey'),
    ],
  },
  daniel: {
    portrait: ph('1598803784715-34ae74c751a3', 'Man in glasses, hand to chin, warm studio light', 'Smart Araromi'),
    portrait2: ph('1599061477170-37d027da2a8c', 'The same man in glasses and a black tee outdoors', 'Smart Araromi'),
    world: [
      ph('1765914448331-206c5441c2f8', 'Running shoe mid-stride on asphalt', 'Taylor Friehl'),
      ph('1615209853186-e4bd66602508', 'Wind turbine emerging from fog at sunrise', 'Sander Weeteling'),
      ph('1613665813446-82a78c468a1d', 'Solar panels under a golden-hour sky', 'Nuno Marques'),
    ],
  },
  tomas: {
    portrait: ph('1633116179577-586e7f813ea5', 'Bearded man smiling in golden-hour light', 'Sonny Mauricio'),
    portrait2: ph('1633115736673-898da33369e5', 'The same man laughing beneath leaves', 'Sonny Mauricio'),
    world: [
      ph('1609881583302-61548332039c', 'Hands shaping a clay pot on a pottery wheel', 'Earl Wilcox'),
      ph('1530006498959-b7884e829a04', 'Two speckled glazed ceramic bowls', 'Tom Crew'),
      ph('1610206349499-c932c3b3aacb', 'Ceramic cups and bowls on studio shelves', 'Manki Kim'),
    ],
  },
  leila: {
    portrait: ph('1788534931554-0918a0df1a35', 'Woman with short curly brown hair, direct gaze, brick backdrop', 'Sou Jest'),
    portrait2: ph('1788534932572-563d2c38520b', 'The same woman in profile against brick', 'Sou Jest'),
    world: [
      ph('1551302175-952301267d19', 'Video editing timeline on a monitor', 'Skye Studios'),
      ph('1478720568477-152d9b164e26', 'Film projector casting a beam through haze', 'Jeremy Yap'),
      ph('1440404653325-ab127d49abc1', 'Vintage film reels and projector', 'Noom Peerapong'),
    ],
  },
  hana: {
    portrait: ph('1691495258003-aa698004a721', 'Woman in a denim dress smiling softly among leaves', 'Cunyu 7'),
    portrait2: ph('1687443431610-0d033b116a35', 'The same woman in profile, hand in her hair', 'Cunyu 7'),
    world: [
      ph('1659666287295-7da26c3f80d4', 'Colourful holds on an indoor climbing wall', 'Se. Tsuchiya'),
      ph('1655313719493-16ebe4906441', 'Stethoscope on a pale blue background', 'Etactics Inc'),
      ph('1662038271111-5b1c0b4157e8', 'Steaming mug in morning window light', 'Aimee Giles'),
    ],
  },
  chloe: {
    portrait: ph('1557053910-d9eadeed1c58', 'Freckled woman with auburn hair in a red sweater, mustard wall', 'Olena Bohovyk'),
    portrait2: ph('1578432133819-d2ef4bb97cf5', 'The same woman in close-up, glancing sideways', 'Olena Bohovyk'),
    world: [
      ph('1604866830893-c13cafa515d5', 'Narrow aisle lined with full bookshelves', 'Olena Bohovyk'),
      ph('1479142506502-19b3a3b7ff33', 'Antique leather-bound books behind glass', 'Clarisse Meyer'),
      ph('1591951425328-48c1fe7179cd', 'Close-up of an aged book page', 'Olga Tutunaru'),
    ],
  },
  priya: {
    portrait: ph('1646979201169-e83d743bfa8d', 'Woman in a red sari, hand to cheek, mustard backdrop', 'Anil Sharma'),
    portrait2: ph('1646979201225-00e36437d09e', 'The same woman smiling in a red shawl', 'Anil Sharma'),
    world: [
      ph('1643287928605-b8e1190615fa', 'Hands on a harmonium beside red flowers', 'Saubhagya gandharv'),
      ph('1750969185331-e03829f72c7d', 'Abstract network of blue lines', 'Max Petrunin'),
      ph('1507838153414-b4b713384a76', 'Sheet music in shallow focus', 'Marius Masalar'),
    ],
  },
  amara: {
    portrait: ph('1629817561368-4eb033ba93d0', 'Woman in a white shirt smiling on a green park chair', 'Benjamin Ngo'),
    portrait2: ph('1629817561283-e88cdf45cd70', 'The same woman glancing over her shoulder in the park', 'Benjamin Ngo'),
    world: [
      ph('1708685889320-6c32b027f8b6', 'Close-up of a city street map', 'Egor Myznik'),
      ph('1647175529799-a24f4cdb3618', 'Urban planning scale model of city blocks', 'Jirka Konietzny'),
      ph('1547566420-c0036b49cb8d', 'Paris rooftops at dusk', 'Adrien'),
    ],
  },
  rowan: {
    portrait: ph('1702906131663-fd2d4a7e36df', 'Person with short tousled hair in a black sleeveless turtleneck, side light', 'Itadaki'),
    portrait2: ph('1702906134732-07406db7391d', 'The same person, three-quarter view', 'Itadaki'),
    world: [
      ph('1574517947730-55cb23e608c2', 'Analog mixing console in a recording studio', 'Marc Fanelli-Isla'),
      ph('1600148272607-7bbf03a40d3b', 'Modular synthesizer with patch cables', 'Ryunosuke Kikuno'),
      ph('1585298723682-7115561c51b7', 'Studio headphones in black and white', 'Sebastian Banasiewcz'),
    ],
  },
  ananya: {
    portrait: ph('1727782916911-3691c73fcedc', 'Woman with glasses and long dark hair in soft daylight', 'Abhinav Roy'),
    portrait2: ph('1727782991370-f532fa0b691e', 'The same woman in a denim jacket, hand in her hair', 'Abhinav Roy'),
    world: [
      ph('1522542550221-31fd19575a2d', 'Watercolour wireframe sketches of app layouts', 'Hal Gatewood'),
      ph('1581079289196-67865ea83118', 'Fan deck of colour swatches', 'Mika Baumeister'),
      ph('1576153192396-180ecef2a715', 'Hand sketching mobile wireframes in pen', 'Amélie Mourichon'),
    ],
  },
}

// Indexed by Venue.photo in venues.ts.
export const VENUE_PHOTOS: Photo[] = [
  ph('1607329211280-a5dc05f6117d', 'Wine bar with glowing bottle shelves on a brick wall', 'Hanxiao Xu'), // 0 lantern
  ph('1602215967218-817e91b4ca99', 'Glass of white wine on a wooden counter, warm bokeh', 'Jordon Kaplan'), // 1 marrow
  ph('1648808678096-18f488fd6858', 'Small jazz stage under a neon sign in red light', 'Erin With'), // 2 halcyon
  ph('1720694924759-2a2daaa98987', 'Wooden omakase counter with stools in low warm light', 'Panos Katsigiannis'), // 3 sable
  ph('1692627806647-2ca49614fa44', 'Glasshouse café with palms and white chairs', 'Pascal Bullan'), // 4 glasshouse
  ph('1607423730403-b7fc1eb83ce0', 'Bookshop café with pendant lamps and reading tables', 'Hayffield L'), // 5 paperback
  ph('1610206349499-c932c3b3aacb', 'Ceramic cups and bowls on studio shelves', 'Manki Kim'), // 6 kiln
  ph('1574517947730-55cb23e608c2', 'Analog mixing console in a listening room', 'Marc Fanelli-Isla'), // 7 oriole
]

export const TEXTURES: Photo[] = [
  ph('1476900164809-ff19b8ae5968', 'Field of tealights in the dark', 'Mike Labrum'),
  ph('1616410731303-6affae095a0a', 'Warm beige recycled paper grain', 'Kiwihug'),
  ph('1642069526127-75907e007187', 'Red wax seal on a handwritten letter', 'Olha Vilkha'),
  ph('1570304816841-906a17d7b067', 'Manhattan skyline at pink dusk', 'Mark Boss'),
]
