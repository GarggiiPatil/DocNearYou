import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { patientAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
import { MapPin, Navigation, Hospital, Building2, Phone, Clock, ExternalLink } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const NearbyDoctors = () => {
  const navigate = useNavigate();
  const [userLocation, setUserLocation] = useState({ lat: 16.6757, lng: 74.2125 });
  const [searchRadius, setSearchRadius] = useState(5000);
  const [loading, setLoading] = useState(false);
  const [places, setPlaces] = useState([]);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedPlace, setSelectedPlace] = useState(null);

  useEffect(() => {
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (userLocation) {
      fetchNearbyPlaces();
    }
  }, [userLocation, searchRadius, selectedType]);

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          toast.info('Using Islampur, Maharashtra as default location');
        }
      );
    }
  };

  const fetchNearbyPlaces = async () => {
    setLoading(true);
    try {
      // Only fetch hospitals and clinics (removed doctors)
      const types = selectedType === 'all' 
        ? ['hospital', 'clinic'] 
        : [selectedType];
      
      let allPlaces = [];

      for (const type of types) {
        const query = `
          [out:json][timeout:25];
          (
            node["amenity"="${type}"](around:${searchRadius},${userLocation.lat},${userLocation.lng});
            way["amenity"="${type}"](around:${searchRadius},${userLocation.lat},${userLocation.lng});
            node["healthcare"="${type}"](around:${searchRadius},${userLocation.lat},${userLocation.lng});
            way["healthcare"="${type}"](around:${searchRadius},${userLocation.lat},${userLocation.lng});
          );
          out center;
        `;

        try {
          const response = await fetch('https://overpass-api.de/api/interpreter', {
            method: 'POST',
            body: query,
            headers: { 'Content-Type': 'text/plain' }
          });

          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }

          const data = await response.json();
          
          const formattedPlaces = data.elements.map(place => ({
            id: place.id,
            name: place.tags?.name || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type: type,
            latitude: place.lat || place.center?.lat,
            longitude: place.lon || place.center?.lon,
            address: place.tags?.['addr:street'] || place.tags?.['addr:city'] || 'Address not available',
            phone: place.tags?.phone || place.tags?.['contact:phone'] || 'N/A',
            opening_hours: place.tags?.opening_hours || 'Not specified',
            website: place.tags?.website || place.tags?.['contact:website'],
            distance: calculateDistance(
              userLocation.lat, 
              userLocation.lng, 
              place.lat || place.center?.lat, 
              place.lon || place.center?.lon
            )
          })).filter(p => p.latitude && p.longitude);

          allPlaces = [...allPlaces, ...formattedPlaces];
        } catch (error) {
          console.error(`Error fetching ${type}:`, error);
        }
      }

      // Sort by distance
      allPlaces.sort((a, b) => a.distance - b.distance);
      setPlaces(allPlaces);
      
      if (allPlaces.length > 0) {
        toast.success(`Found ${allPlaces.length} healthcare facilities nearby`);
      } else {
        toast.info('No healthcare facilities found in this area');
      }
    } catch (error) {
      console.error('Error fetching places:', error);
      toast.error('Failed to fetch healthcare facilities');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to calculate distance
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'hospital': return '#ef4444';
      case 'clinic': return '#3b82f6';
      default: return '#6366f1';
    }
  };

  const getTypeIcon = (type) => {
    switch(type) {
      case 'hospital': return <Hospital size={20} />;
      case 'clinic': return <Building2 size={20} />;
      default: return <MapPin size={20} />;
    }
  };

  // Handle place click to book appointment
  const handleBookAppointment = (place) => {
    // Convert place data to doctor format for appointment booking
    const doctorData = {
      _id: place.id,
      name: place.name,
      specialization: place.type === 'hospital' ? 'Hospital' : 'Clinic',
      hospital: place.name,
      location: {
        address: place.address,
        coordinates: [place.longitude, place.latitude]
      },
      phone: place.phone,
      distance: place.distance
    };

    navigate('/patient/book-appointment', { state: { doctor: doctorData } });
  };

  return (
    <div className="container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h1 style={{ margin: 0 }}>
            <MapPin style={{ display: 'inline', marginRight: '10px' }} />
            Nearby Healthcare!!
          </h1>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button className="btn btn-primary" onClick={getCurrentLocation}>
              <Navigation size={18} style={{ marginRight: '5px' }} />
              Use My Location
            </button>
            <button className="btn btn-secondary" onClick={() => navigate('/patient/dashboard')}>
              Back
            </button>
          </div>
        </div>

        {/* Location Info */}
        <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
          <p style={{ margin: 0 }}>
            <strong>Location:</strong> Islampur, Maharashtra ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
          </p>
        </div>

        {/* Filters - Removed Doctors option */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedType('all')}
            className={selectedType === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
          >
            All
          </button>
          <button
            onClick={() => setSelectedType('hospital')}
            className={selectedType === 'hospital' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ background: selectedType === 'hospital' ? '#ef4444' : undefined }}
          >
            <Hospital size={16} style={{ marginRight: '5px' }} /> Hospitals
          </button>
          <button
            onClick={() => setSelectedType('clinic')}
            className={selectedType === 'clinic' ? 'btn btn-primary' : 'btn btn-secondary'}
            style={{ background: selectedType === 'clinic' ? '#3b82f6' : undefined }}
          >
            <Building2 size={16} style={{ marginRight: '5px' }} /> Clinics
          </button>

          <div style={{ marginLeft: 'auto' }}>
            <label style={{ marginRight: '10px' }}><strong>Radius:</strong></label>
            <select
              value={searchRadius}
              onChange={(e) => setSearchRadius(Number(e.target.value))}
              style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
            >
              <option value={2000}>2 km</option>
              <option value={5000}>5 km</option>
              <option value={10000}>10 km</option>
              <option value={20000}>20 km</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map and List */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Map */}
        <div style={{ background: 'white', borderRadius: '15px', padding: '20px', height: '600px' }}>
          <h2>Map View</h2>
          <div style={{ height: 'calc(100% - 50px)', borderRadius: '10px', overflow: 'hidden' }}>
            <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; OpenStreetMap contributors'
              />
              <Marker position={[userLocation.lat, userLocation.lng]}>
                <Popup>Your Location</Popup>
              </Marker>
              <Circle
                center={[userLocation.lat, userLocation.lng]}
                radius={searchRadius}
                pathOptions={{ color: '#667eea', fillColor: '#667eea', fillOpacity: 0.1 }}
              />
              {places.map(place => (
                <Marker
                  key={place.id}
                  position={[place.latitude, place.longitude]}
                  icon={createCustomIcon(getTypeColor(place.type))}
                >
                  <Popup>
                    <div style={{ minWidth: '150px' }}>
                      <strong>{place.name}</strong><br />
                      <span style={{ fontSize: '12px', color: '#666' }}>
                        {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
                      </span><br />
                      <span style={{ fontSize: '12px' }}>
                        {(place.distance / 1000).toFixed(2)} km away
                      </span><br />
                      <button
                        onClick={() => handleBookAppointment(place)}
                        style={{
                          marginTop: '8px',
                          padding: '6px 12px',
                          background: getTypeColor(place.type),
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          width: '100%'
                        }}
                      >
                        Book Appointment
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>

        {/* List */}
        <div style={{ background: 'white', borderRadius: '15px', padding: '20px', height: '600px', overflowY: 'auto' }}>
          <h2>Found {places.length} Places</h2>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <p>Loading healthcare facilities...</p>
            </div>
          ) : places.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
              <Hospital size={48} style={{ margin: '0 auto 10px', opacity: 0.3 }} />
              <p>No healthcare facilities found in this area</p>
              <p style={{ fontSize: '14px' }}>Try increasing the search radius</p>
            </div>
          ) : (
            places.map(place => (
              <div
                key={place.id}
                style={{
                  border: `2px solid ${getTypeColor(place.type)}`,
                  borderRadius: '10px',
                  padding: '15px',
                  marginBottom: '15px',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  background: selectedPlace?.id === place.id ? '#f9fafb' : 'white'
                }}
                onClick={() => setSelectedPlace(place)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{
                    background: getTypeColor(place.type),
                    color: 'white',
                    padding: '8px',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {getTypeIcon(place.type)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: 0, fontSize: '16px' }}>{place.name}</h3>
                    <p style={{ margin: '2px 0', color: '#666', fontSize: '13px' }}>
                      {place.type.charAt(0).toUpperCase() + place.type.slice(1)}
                    </p>
                  </div>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: getTypeColor(place.type),
                    fontSize: '14px'
                  }}>
                    {(place.distance / 1000).toFixed(2)} km
                  </span>
                </div>

                {place.address && place.address !== 'Address not available' && (
                  <p style={{ margin: '8px 0', fontSize: '13px', color: '#4b5563' }}>
                    <MapPin size={14} style={{ display: 'inline', marginRight: '5px' }} />
                    {place.address}
                  </p>
                )}

                {place.phone !== 'N/A' && (
                  <p style={{ margin: '8px 0', fontSize: '13px', color: '#4b5563' }}>
                    <Phone size={14} style={{ display: 'inline', marginRight: '5px' }} />
                    {place.phone}
                  </p>
                )}

                {place.opening_hours && place.opening_hours !== 'Not specified' && (
                  <p style={{ margin: '8px 0', fontSize: '13px', color: '#4b5563' }}>
                    <Clock size={14} style={{ display: 'inline', marginRight: '5px' }} />
                    {place.opening_hours}
                  </p>
                )}

                <button
                  className="btn btn-primary"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBookAppointment(place);
                  }}
                  style={{ 
                    width: '100%', 
                    marginTop: '10px',
                    background: getTypeColor(place.type),
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <ExternalLink size={16} />
                  Book Appointment
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};



export default NearbyDoctors;

// import React, { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { toast } from 'react-toastify';
// import { patientAPI } from '../services/api';
// import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet';
// import { MapPin, Navigation, Hospital, Stethoscope, Building2, Phone, Clock } from 'lucide-react';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';

// // Fix for default markers
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//   iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//   shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
// });

// const createCustomIcon = (color) => {
//   return new L.Icon({
//     iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
//     iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
//     shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
//     iconSize: [25, 41],
//     iconAnchor: [12, 41],
//     popupAnchor: [1, -34],
//     shadowSize: [41, 41]
//   });
// };

// const NearbyDoctors = () => {
//   const navigate = useNavigate();
//   const [userLocation, setUserLocation] = useState({ lat: 16.6757, lng: 74.2125 });
//   const [searchRadius, setSearchRadius] = useState(5000);
//   const [loading, setLoading] = useState(false);
//   const [places, setPlaces] = useState([]);
//   const [selectedType, setSelectedType] = useState('all');
//   const [selectedPlace, setSelectedPlace] = useState(null);

//   useEffect(() => {
//     getCurrentLocation();
//   }, []);

//   useEffect(() => {
//     if (userLocation) {
//       fetchNearbyPlaces();
//     }
//   }, [userLocation, searchRadius, selectedType]);

//   const getCurrentLocation = () => {
//     if (navigator.geolocation) {
//       navigator.geolocation.getCurrentPosition(
//         (position) => {
//           setUserLocation({
//             lat: position.coords.latitude,
//             lng: position.coords.longitude
//           });
//         },
//         (error) => {
//           toast.info('Using Islampur, Maharashtra as default location');
//         }
//       );
//     }
//   };

//   // const fetchNearbyPlaces = async () => {
//   //   setLoading(true);
//   //   try {
//   //     const response = await patientAPI.getNearbyHealthcare(
//   //       userLocation.lat,
//   //       userLocation.lng,
//   //       searchRadius,
//   //       selectedType
//   //     );
//   //     setPlaces(response.data.data);
//   //     toast.success(`Found ${response.data.count} healthcare facilities`);
//   //   } catch (error) {
//   //     console.error('Error fetching places:', error);
//   //     toast.error('Failed to fetch healthcare facilities');
//   //   } finally {
//   //     setLoading(false);
//   //   }
//   // };

//   const fetchNearbyPlaces = async () => {
//   setLoading(true);
//   try {
//     // Only fetch from OpenStreetMap - no backend call
//     const types = selectedType === 'all' 
//       ? ['hospital', 'clinic', 'doctors'] 
//       : [selectedType];
    
//     let allPlaces = [];

//     for (const type of types) {
//       const query = `
//         [out:json][timeout:25];
//         (
//           node["amenity"="${type}"](around:${searchRadius},${userLocation.lat},${userLocation.lng});
//           way["amenity"="${type}"](around:${searchRadius},${userLocation.lat},${userLocation.lng});
//           node["healthcare"="${type}"](around:${searchRadius},${userLocation.lat},${userLocation.lng});
//           way["healthcare"="${type}"](around:${searchRadius},${userLocation.lat},${userLocation.lng});
//         );
//         out center;
//       `;

//       try {
//         const response = await fetch('https://overpass-api.de/api/interpreter', {
//           method: 'POST',
//           body: query,
//           headers: { 'Content-Type': 'text/plain' }
//         });

//         if (!response.ok) {
//           throw new Error(`HTTP error! status: ${response.status}`);
//         }

//         const data = await response.json();
        
//         const formattedPlaces = data.elements.map(place => ({
//           id: place.id,
//           name: place.tags?.name || `${type.charAt(0).toUpperCase() + type.slice(1)}`,
//           type: type,
//           latitude: place.lat || place.center?.lat,
//           longitude: place.lon || place.center?.lon,
//           address: place.tags?.['addr:street'] || place.tags?.['addr:city'] || 'Address not available',
//           phone: place.tags?.phone || place.tags?.['contact:phone'] || 'N/A',
//           opening_hours: place.tags?.opening_hours || 'Not specified',
//           website: place.tags?.website || place.tags?.['contact:website'],
//           distance: calculateDistance(
//             userLocation.lat, 
//             userLocation.lng, 
//             place.lat || place.center?.lat, 
//             place.lon || place.center?.lon
//           )
//         })).filter(p => p.latitude && p.longitude);

//         allPlaces = [...allPlaces, ...formattedPlaces];
//       } catch (error) {
//         console.error(`Error fetching ${type}:`, error);
//       }
//     }

//       // Sort by distance
//       allPlaces.sort((a, b) => a.distance - b.distance);
//       setPlaces(allPlaces);
      
//       if (allPlaces.length > 0) {
//         toast.success(`Found ${allPlaces.length} healthcare facilities nearby`);
//       } else {
//         toast.info('No healthcare facilities found in this area');
//       }
//     } catch (error) {
//       console.error('Error fetching places:', error);
//       toast.error('Failed to fetch healthcare facilities');
//     } finally {
//       setLoading(false);
//     }
//   };

// // Add helper function
//     const calculateDistance = (lat1, lon1, lat2, lon2) => {
//       const R = 6371e3;
//       const φ1 = lat1 * Math.PI / 180;
//       const φ2 = lat2 * Math.PI / 180;
//       const Δφ = (lat2 - lat1) * Math.PI / 180;
//       const Δλ = (lon2 - lon1) * Math.PI / 180;

//       const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
//               Math.cos(φ1) * Math.cos(φ2) *
//               Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
//       const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

//       return R * c;
//     };

//   const getTypeColor = (type) => {
//     switch(type) {
//       case 'hospital': return '#ef4444';
//       case 'clinic': return '#3b82f6';
//       case 'doctors': return '#10b981';
//       default: return '#6366f1';
//     }
//   };

//   const getTypeIcon = (type) => {
//     switch(type) {
//       case 'hospital': return <Hospital size={20} />;
//       case 'clinic': return <Building2 size={20} />;
//       case 'doctors': return <Stethoscope size={20} />;
//       default: return <MapPin size={20} />;
//     }
//   };

//   return (
//     <div className="container" style={{ padding: '20px', maxWidth: '1400px', margin: '0 auto' }}>
//       {/* Header */}
//       <div style={{ background: 'white', borderRadius: '15px', padding: '25px', marginBottom: '20px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
//         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
//           <h1 style={{ margin: 0 }}>
//             <MapPin style={{ display: 'inline', marginRight: '10px' }} />
//             Nearby Healthcare
//           </h1>
//           <div style={{ display: 'flex', gap: '10px' }}>
//             <button className="btn btn-primary" onClick={getCurrentLocation}>
//               <Navigation size={18} style={{ marginRight: '5px' }} />
//               Use My Location
//             </button>
//             <button className="btn btn-secondary" onClick={() => navigate('/patient/dashboard')}>
//               Back
//             </button>
//           </div>
//         </div>

//         {/* Location Info */}
//         <div style={{ background: '#f3f4f6', padding: '15px', borderRadius: '10px', marginBottom: '20px' }}>
//           <p style={{ margin: 0 }}>
//             <strong>Location:</strong> Islampur, Maharashtra ({userLocation.lat.toFixed(4)}, {userLocation.lng.toFixed(4)})
//           </p>
//         </div>

//         {/* Filters */}
//         <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
//           <button
//             onClick={() => setSelectedType('all')}
//             className={selectedType === 'all' ? 'btn btn-primary' : 'btn btn-secondary'}
//           >
//             All
//           </button>
//           <button
//             onClick={() => setSelectedType('hospital')}
//             className={selectedType === 'hospital' ? 'btn btn-primary' : 'btn btn-secondary'}
//             style={{ background: selectedType === 'hospital' ? '#ef4444' : undefined }}
//           >
//             <Hospital size={16} style={{ marginRight: '5px' }} /> Hospitals
//           </button>
//           <button
//             onClick={() => setSelectedType('clinic')}
//             className={selectedType === 'clinic' ? 'btn btn-primary' : 'btn btn-secondary'}
//             style={{ background: selectedType === 'clinic' ? '#3b82f6' : undefined }}
//           >
//             <Building2 size={16} style={{ marginRight: '5px' }} /> Clinics
//           </button>
//           <button
//             onClick={() => setSelectedType('doctors')}
//             className={selectedType === 'doctors' ? 'btn btn-primary' : 'btn btn-secondary'}
//             style={{ background: selectedType === 'doctors' ? '#10b981' : undefined }}
//           >
//             <Stethoscope size={16} style={{ marginRight: '5px' }} /> Doctors
//           </button>

//           <div style={{ marginLeft: 'auto' }}>
//             <label style={{ marginRight: '10px' }}><strong>Radius:</strong></label>
//             <select
//               value={searchRadius}
//               onChange={(e) => setSearchRadius(Number(e.target.value))}
//               style={{ padding: '8px', borderRadius: '5px', border: '1px solid #ddd' }}
//             >
//               <option value={2000}>2 km</option>
//               <option value={5000}>5 km</option>
//               <option value={10000}>10 km</option>
//               <option value={20000}>20 km</option>
//             </select>
//           </div>
//         </div>
//       </div>

//       {/* Map and List */}
//       <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
//         {/* Map */}
//         <div style={{ background: 'white', borderRadius: '15px', padding: '20px', height: '600px' }}>
//           <h2>Map View</h2>
//           <div style={{ height: 'calc(100% - 50px)', borderRadius: '10px', overflow: 'hidden' }}>
//             <MapContainer center={[userLocation.lat, userLocation.lng]} zoom={13} style={{ height: '100%', width: '100%' }}>
//               <TileLayer
//                 url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
//                 attribution='&copy; OpenStreetMap contributors'
//               />
//               <Marker position={[userLocation.lat, userLocation.lng]}>
//                 <Popup>Your Location</Popup>
//               </Marker>
//               <Circle
//                 center={[userLocation.lat, userLocation.lng]}
//                 radius={searchRadius}
//                 pathOptions={{ color: '#667eea', fillColor: '#667eea', fillOpacity: 0.1 }}
//               />
//               {places.map(place => (
//                 <Marker
//                   key={place.id}
//                   position={[place.latitude, place.longitude]}
//                   icon={createCustomIcon(getTypeColor(place.type))}
//                 >
//                   <Popup>
//                     <strong>{place.name}</strong><br />
//                     {place.type}<br />
//                     {(place.distance / 1000).toFixed(2)} km away
//                   </Popup>
//                 </Marker>
//               ))}
//             </MapContainer>
//           </div>
//         </div>

//         {/* List */}
//         <div style={{ background: 'white', borderRadius: '15px', padding: '20px', height: '600px', overflowY: 'auto' }}>
//           <h2>Found {places.length} Places</h2>
//           {loading ? (
//             <p>Loading...</p>
//           ) : places.length === 0 ? (
//             <p>No places found</p>
//           ) : (
//             places.map(place => (
//               <div
//                 key={place.id}
//                 style={{
//                   border: '1px solid #ddd',
//                   borderRadius: '10px',
//                   padding: '15px',
//                   marginBottom: '15px',
//                   cursor: 'pointer'
//                 }}
//                 onClick={() => setSelectedPlace(place)}
//               >
//                 <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
//                   {getTypeIcon(place.type)}
//                   <div>
//                     <h3 style={{ margin: 0 }}>{place.name}</h3>
//                     <p style={{ margin: '5px 0', color: '#666' }}>{place.type}</p>
//                   </div>
//                   <span style={{ marginLeft: 'auto', fontWeight: 'bold' }}>
//                     {(place.distance / 1000).toFixed(2)} km
//                   </span>
//                 </div>
//                 {place.phone !== 'N/A' && <p><Phone size={14} /> {place.phone}</p>}
//                 {place.isRegistered && (
//                   <button
//                     className="btn btn-primary"
//                     onClick={() => navigate('/patient/book-appointment', { state: { doctor: place } })}
//                     style={{ width: '100%', marginTop: '10px' }}
//                   >
//                     Book Appointment
//                   </button>
//                 )}
//               </div>
//             ))
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default NearbyDoctors;