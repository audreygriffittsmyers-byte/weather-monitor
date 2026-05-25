// Atlantic Aviation WATCH -- FBO Ground Handling Prep & Response Guides
// Loaded lazily when Prep Guides tab is first opened
window.PREP_GUIDES = [
  { id:'severe-thunderstorm', title:'Severe Thunderstorm', icon:'⛈', color:'#EA3232',
    triggers:['Severe Thunderstorm Warning','Severe Thunderstorm Watch','Tornado Watch'],
    sections:[
      { heading:'Immediate Actions — Warning Issued', items:[
        'STOP all fueling operations immediately. Cap all fuel nozzles and secure connections.',
        'CLEAR the ramp of all personnel. No one should be outside during a Severe Thunderstorm Warning.',
        'SECURE all ground service equipment (GSE). Chock all vehicles. Close all hangar doors.',
        'NOTIFY all pilots and passengers on ramp to move to the terminal building or hangar immediately.',
        'DOCUMENT time of warning and actions taken. Note aircraft tail numbers on unattended ramp.',
        'DO NOT resume operations until the warning expires AND at least 30 minutes have passed since the last lightning within 5 miles.',
      ]},
      { heading:'Watch Phase — Prepare Now', items:[
        'Brief all ramp and line service staff. Assign a weather monitor to track NWS updates.',
        'Move portable equipment, fuel hoses, and loose items to sheltered positions.',
        'Stage vehicles to be quickly moved inside if a Warning is issued.',
        'Confirm all aircraft tiedowns are secure. Add supplemental tiedowns for large-surface aircraft.',
        'Brief inbound pilots on the watch. Advise delay or alternate routing if a Warning is likely.',
        'Identify and post shelter locations. Conduct a headcount plan walkthrough with all staff.',
      ]},
      { heading:'Lightning Protocol — 5-Mile Rule', items:[
        'ALL outdoor operations cease when lightning is within 5 miles (flash-to-thunder 25 seconds or less).',
        'This includes fueling, towing, marshaling, baggage handling, and any aircraft servicing.',
        'The 30-minute all-clear clock RESTARTS with every new lightning strike within 5 miles.',
        'A supervisor must authorize return to operations after the all-clear.',
      ]},
      { heading:'Fueling-Specific', items:[
        'Fueling near or during electrical storms is prohibited. Static electricity risk is elevated.',
        'Ground all aircraft before connecting fuel nozzles. Verify grounding cable before opening caps.',
        'If lightning threatens during active fueling: close cap, remove nozzle, secure hose, evacuate immediately.',
        'Do not perform fuel farm operations during active warnings.',
      ]},
      { heading:'Towing & Ground Movement', items:[
        'Cease all aircraft towing when a Severe Thunderstorm Warning is issued.',
        'If a tow is in progress: move aircraft to nearest safe position, apply brakes and chocks.',
        'Do not position aircraft near taxiway edges, fuel pits, or structures.',
        'Disconnect tow bars and secure tow vehicles in hangar or away from ramp.',
      ]},
      { heading:'Post-Storm Inspection', items:[
        'Perform a ramp walk before resuming. Check for debris, standing water, hail damage, and FOD.',
        'Inspect all aircraft on ramp for hail damage before servicing or marshaling.',
        'Check fuel farm and fuel pits for debris or contamination before dispensing.',
        'Document all damage. Notify management immediately. Report per safety incident procedures.',
      ]},
    ]
  },
  { id:'tornado', title:'Tornado Warning', icon:'🌪', color:'#dc2626',
    triggers:['Tornado Warning','Tornado Watch'],
    sections:[
      { heading:'Tornado Warning — IMMEDIATE LIFE SAFETY', items:[
        'THIS IS A LIFE-SAFETY EVENT. All outdoor operations stop immediately.',
        'EVACUATE all staff from ramp, flight line, and hangars to the designated shelter immediately.',
        'Shelter: interior rooms on the lowest floor, away from windows and exterior walls.',
        'DO NOT shelter in hangars or in aircraft. Both are extremely dangerous during a tornado.',
        'Account for ALL personnel before considering any other action.',
        'Call 911 immediately if anyone is injured or unaccounted for.',
      ]},
      { heading:'Watch Phase', items:[
        'A Watch means conditions are favorable for tornado development. Treat as elevated alert.',
        'All staff should know the shelter location before any Warning is issued.',
        'Reduce non-essential ramp activity. Keep crews close to shelter.',
        'Monitor continuously for Watch-to-Warning escalation.',
        'Advise all inbound pilots of watch conditions. Recommend delay or divert.',
      ]},
      { heading:'After the All Clear', items:[
        'Do not leave shelter until the Warning is officially cancelled by NWS or emergency management.',
        'Perform full ramp and facility inspection before resuming any operations.',
        'Check for structural damage to hangars, terminal, and fuel farm before entry.',
        'Do not attempt to move damaged aircraft without a qualified mechanic and management authorization.',
      ]},
    ]
  },
  { id:'high-wind', title:'High Wind / Damaging Winds', icon:'💨', color:'#ca8a04',
    triggers:['High Wind Warning','High Wind Watch','Wind Advisory'],
    sections:[
      { heading:'Operational Wind Thresholds', items:[
        'Wind Advisory (25-39 mph sustained): Use caution on ramp. Secure all loose items.',
        'High Wind Warning (40+ mph sustained or 58+ mph gusts): Cease open-air fueling. Suspend unsupported towing.',
        'Convective gusts above 50 mph can tip aircraft. Maintain heightened vigilance.',
      ]},
      { heading:'Ramp & Ground Operations', items:[
        'Secure all loose ramp items: chocks, cones, tiedown rings, fuel hose caps, mats, and signage.',
        'Move portable GSE (stairs, belt loaders, GPU carts) into hangars or sheltered positions.',
        'Verify all parked aircraft tiedowns are properly secured.',
        'Add supplemental tiedown points to aircraft with large control surfaces.',
        'Close all hangar doors not actively in use.',
      ]},
      { heading:'Fueling in High Wind', items:[
        'Fueling in winds exceeding 40 mph should use two-person crews minimum.',
        'Maintain control of fuel hoses at all times. A loose hose in high wind is a serious injury risk.',
        'Fuel vapor dispersal increases across open fuel ports. Clear ignition sources within 50 feet.',
      ]},
      { heading:'Towing in High Wind', items:[
        'Aircraft towing in winds above 35 mph requires supervisor approval.',
        'Wind gusts can overpower tow bar steering on light and large-surface aircraft.',
        'Use additional wing walkers when towing in gusty conditions.',
        'Move aircraft into hangars proactively before winds reach warning levels.',
      ]},
    ]
  },
  { id:'winter-storm', title:'Winter Storm / Ice / Snow', icon:'❄', color:'#3b82f6',
    triggers:['Winter Storm Warning','Winter Storm Watch','Ice Storm Warning','Blizzard Warning','Freezing Rain Advisory','Freeze Warning'],
    sections:[
      { heading:'Before the Storm', items:[
        'Pre-treat ramp surfaces with deicer or sand as storm approaches. Do not wait for accumulation.',
        'Ensure adequate supply of aircraft deice fluid (Type I, II, IV). Verify deice equipment is operational.',
        'Fuel aircraft before icing begins where practical.',
        'Stage snow removal equipment and confirm operators are available.',
      ]},
      { heading:'Ice Storm — Critical Operations', items:[
        'Ice accumulation of 1/4 inch or more is operationally significant. Reduce all outdoor movement.',
        'Walking surfaces become extremely hazardous. Issue slip-resistant footwear to all outdoor personnel.',
        'Aircraft deicing is mandatory for any aircraft departing with any visible ice, frost, or snow contamination.',
        'Clean aircraft concept: NO frozen contamination is acceptable on any lifting or control surface at departure.',
        'Towing on icy surfaces: reduce tow speed significantly and use wing walkers on both sides.',
      ]},
      { heading:'Snow Operations', items:[
        'Coordinate ramp snow removal with airport operations. Do not plow snow onto active taxiways.',
        'Snow on aircraft must be removed before any engine start or towing.',
        'Install engine inlet covers, pitot covers, and control locks on aircraft remaining overnight.',
        'Monitor apron drainage. Melt-refreeze cycles create significant overnight slip hazards.',
      ]},
      { heading:'Personnel Safety', items:[
        'Hypothermia and frostbite are serious risks for ramp personnel in extended cold exposure.',
        'Rotate outdoor crews frequently. Max continuous exposure: 20 minutes below 10°F with wind chill.',
        'Provide warming station access. Cold hands lead to grip failures and dropped equipment.',
        'Required PPE: cold-rated gloves, insulated footwear, high-visibility insulated outerwear.',
      ]},
    ]
  },
  { id:'flood', title:'Flooding / Flash Flood', icon:'🌊', color:'#1e40af',
    triggers:['Flash Flood Warning','Flash Flood Watch','Flood Warning','Flood Watch'],
    sections:[
      { heading:'Flash Flood Warning — Immediate Actions', items:[
        'Move all vehicles and GSE to highest available ground on ramp immediately.',
        'Do not drive through flooded areas. As little as 6 inches of moving water can sweep a vehicle.',
        'If flooding is imminent to ramp level: notify airport operations immediately.',
        'Advise all inbound aircraft of ground flooding conditions. Consider delaying arrivals.',
      ]},
      { heading:'Ramp & Facility Protection', items:[
        'Move aircraft parked in low-lying ramp areas to higher elevation if safe and time permits.',
        'Fuel farm: inspect for potential inundation. Floating fuel and contaminated runoff are serious hazards.',
        'Close floor drains where possible to prevent stormwater backflow into hangar.',
      ]},
      { heading:'Post-Flood Recovery', items:[
        'Do not re-enter flooded areas until water recedes fully and area is declared safe.',
        'Inspect all electrical systems for water damage before energizing.',
        'Check aircraft for water entry through engine inlets, pitot tubes, or static ports.',
        'Report all damage per company incident procedures.',
      ]},
    ]
  },
  { id:'extreme-heat', title:'Extreme Heat', icon:'🌡', color:'#dc2626',
    triggers:['Excessive Heat Warning','Excessive Heat Watch','Heat Advisory'],
    sections:[
      { heading:'Personnel Protection', items:[
        'Ramp surface temperatures can exceed 150°F on dark asphalt during extreme heat events.',
        'Heat index above 103°F: implement mandatory rotation and shade breaks every 20 minutes.',
        'Heat index above 115°F: reduce outdoor crew time to maximum 15 minutes per rotation.',
        'Ensure all outdoor staff have continuous access to cool water, electrolyte drinks, and shade.',
        'Heat illness symptoms: heavy sweating, weakness, dizziness, nausea, confusion, hot dry skin.',
        'Suspected heat stroke (confusion, hot skin, no sweating): call 911 immediately. Cool victim rapidly.',
      ]},
      { heading:'Fueling in Extreme Heat', items:[
        'Fuel expands in heat. Avoid overfilling aircraft tanks. Allow adequate expansion space.',
        'Fuel vapor concentration is significantly elevated in high heat. Minimize all ignition sources.',
        'Do not leave fuel trucks in direct sun for extended periods. Pressure relief valves may open.',
      ]},
      { heading:'Aircraft & Equipment', items:[
        'Advise pilots of performance penalties from high density altitude at departure.',
        'Tire pressure increases with temperature. Verify tire pressure before towing.',
        'Battery-powered GSE may experience thermal cutoff in extreme heat.',
      ]},
    ]
  },
  { id:'fire-weather', title:'Fire Weather / Red Flag', icon:'🔥', color:'#c2410c',
    triggers:['Red Flag Warning','Fire Weather Watch'],
    sections:[
      { heading:'Ramp Fire Risk', items:[
        'Red Flag conditions (low humidity + high wind) dramatically increase fuel vapor ignition risk.',
        'No hot work (welding, grinding, open flame) during Red Flag Warning without management authorization.',
        'Increase vigilance around fuel pit areas, fuel trucks, and engine start zones.',
        'Ensure all fire extinguishers on ramp are accessible and within inspection date.',
      ]},
      { heading:'Fueling Under Red Flag', items:[
        'Verify fuel grounding connections are solid before any fueling. Static spark risk is elevated in dry conditions.',
        'No smoking within 100 feet of fueling operations during Red Flag (increase from standard 50 feet).',
        'Any fuel spill must be reported and neutralized immediately.',
        'Increase clearance zones around open fuel ports. Fuel vapor dispersal is rapid in high wind.',
      ]},
      { heading:'Smoke & Air Quality', items:[
        'Wildfire smoke reduces visibility. Brief pilots on smoke conditions and potential IFR.',
        'AQI above 150: provide N95 respirators for outdoor personnel on extended ramp duty.',
        'AQI above 200: limit prolonged outdoor exposure and increase crew rotation.',
      ]},
    ]
  },
  { id:'hurricane', title:'Hurricane / Tropical Storm', icon:'🌀', color:'#1e3a5f',
    triggers:['Hurricane Warning','Hurricane Watch','Tropical Storm Warning','Tropical Storm Watch','Storm Surge Warning'],
    sections:[
      { heading:'Aircraft Evacuation Decision', items:[
        'Aircraft evacuation is time-critical. Begin no later than 36 hours before projected landfall.',
        'Coordinate with airport operations on evacuation routes, destinations, and timing.',
        'Prioritize: transient aircraft first, then owner-based aircraft, then company equipment.',
        'Fuel all evacuating aircraft as soon as decision is made. Fuel availability decreases rapidly.',
        'Document all aircraft positions, registration numbers, and owner contacts before departure.',
      ]},
      { heading:'72-Hour Pre-Storm Prep', items:[
        'Begin aircraft tiedown inspection and reinforcement. Double tiedowns on all ramp aircraft.',
        'Remove all loose equipment from ramp: signs, cones, hose reels, cords, and furniture.',
        'Drain and secure portable fuel trucks. Secure fuel hoses on hydrant pits.',
        'Back up all FBO records, aircraft databases, and fuel inventory to cloud or offsite.',
      ]},
      { heading:'24-Hour Pre-Storm Actions', items:[
        'Install all engine inlet covers, pitot covers, and control locks on aircraft remaining.',
        'Close all hangar doors and secondary openings. Tape/seal door gaps.',
        'Secure all fuel farm fill points, vents, and drain plugs.',
        'ALL personnel should evacuate before storm arrival. No one remains at the FBO.',
      ]},
      { heading:'Post-Storm Return', items:[
        'Do not return until all-clear is issued by local emergency management AND airport authority.',
        'Assess structural integrity of all buildings before entry.',
        'Check fuel farm for flooding, damage, and contamination before any fueling operations.',
        'Inspect all aircraft for storm damage. Document with photographs.',
        'Submit storm damage report per company policy within 24 hours of return.',
      ]},
    ]
  },
  { id:'fog', title:'Fog / Low Visibility', icon:'🌫', color:'#64748b',
    triggers:['Dense Fog Advisory','Freezing Fog Advisory'],
    sections:[
      { heading:'Ramp Operations in Fog', items:[
        'IFR and LIFR conditions require additional awareness of aircraft movement.',
        'Marshaling in low visibility: use illuminated wands. Maintain visual contact with aircraft.',
        'Vehicle speed on ramp: reduce to walking pace in visibility below 600 feet RVR.',
        'All ramp vehicles must have lights on at all times during fog operations.',
        'Wing walkers required for all towing in low visibility conditions.',
      ]},
      { heading:'Pilot Advisories', items:[
        'Brief inbound pilots on current RVR and visibility trend.',
        'Advise on any NOTAMs related to low visibility at the airport.',
        'Advise departing pilots on destination weather if departure is through a fog bank.',
      ]},
    ]
  },
  { id:'earthquake', title:'Earthquake', icon:'🌍', color:'#7c3aed',
    triggers:['Earthquake'],
    sections:[
      { heading:'During Shaking', items:[
        'DROP, COVER, and HOLD ON. Get under a desk or against an interior wall.',
        'Do not attempt to run to aircraft or move vehicles during active shaking.',
        'Do not run outside during shaking. Most injuries occur from falling debris near exits.',
      ]},
      { heading:'Immediate Post-Quake', items:[
        'Account for all personnel before any damage assessment.',
        'Shut off all fuel pumping operations. Check for fuel line breaks before resuming.',
        'Inspect fuel farm for structural damage and fuel leaks before any operations.',
        'Do not enter any building with visible structural damage.',
        'Be alert for aftershocks for at least 24 hours after a M5+ event.',
      ]},
      { heading:'Relevant Locations', items:[
        'Highest seismic risk: ANC, FAI, SIT, JNU, KTN (Alaska), APC, SMO, LAX, LGB (Southern CA), PDX (Pacific NW).',
      ]},
    ]
  },
  { id:'volcano', title:'Volcanic Activity / Ash Fall', icon:'🌋', color:'#92400e',
    triggers:['Volcano Alert'],
    sections:[
      { heading:'Ash Fall Operations', items:[
        'Volcanic ash is a catastrophic hazard for jet engines. A single encounter can cause immediate engine failure.',
        'DO NOT operate any aircraft in airspace with volcanic ash. Close all engine inlets immediately.',
        'Install engine inlet covers, pitot covers, and all protective covers on all aircraft.',
        'Close all hangar doors and seal gaps to prevent ash infiltration.',
        'All personnel outdoors must wear N95 or better respirators and eye protection.',
      ]},
      { heading:'Post-Ash Cleaning', items:[
        'DO NOT dry brush volcanic ash on aircraft -- it is abrasive and will damage paint and glass.',
        'Use clean water rinse only. Aircraft must be inspected by qualified maintenance after exposure.',
        'Clean all GSE, vehicles, and ramp equipment of ash deposits before use.',
      ]},
      { heading:'Relevant Locations', items:[
        'Atlantic Aviation Alaska locations (ANC, FAI, SIT, JNU, KTN) are in volcanic ash risk zones.',
        'Monitor USGS Alaska Volcano Observatory (avo.alaska.edu) for AK locations.',
      ]},
    ]
  },
];
