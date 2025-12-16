import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './ProfileStyle.css';
import authService from '../../services/auth'; 

const ProfilePage = () => {
    // Stati per i dati
    const [nickname, setNickname] = useState('');
    const [avatarPreview, setAvatarPreview] = useState(null); // URL per l'anteprima
    const [selectedFile, setSelectedFile] = useState(null);   //file da inviare
    
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    
    const fileInputRef = useRef(null);

    // Carica i dati attuali del profilo all'avvio
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                //Nota: in caso  di errore aggiustare la rotta Django
                const user = authService.getCurrentUser();
                if(user) {
                    //per ID nello user object
                    const response = await axios.get(`http://localhost:5000/api/profiles/${user.profile_id || user.id}/`); 
                    setNickname(response.data.nickname || '');
                    // Se c'è già un'immagine salvata, la mostra
                    if (response.data.avatar) {
                        setAvatarPreview(response.data.avatar); 
                    }
                }
            } catch (err) {
                console.error("Errore caricamento profilo", err);
            }
        };
        fetchProfile();
    }, []);

    // gestione selezione file 
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file); // salva il file per inviarlo dopo
            // crea un URL temporaneo per mostrare l'anteprima subito
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    //Funzione per aprire il selettore file cliccando sul bottone/immagine
    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    //Salvataggio dati
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            const user = authService.getCurrentUser();

            const formData = new FormData();
            formData.append('nickname', nickname);
            
            // Aggiungiamo l'immagine solo se l'utente ne ha caricata una nuova
            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            //è necessario che l'interceptor non forzi application/json
            await axios.patch(`http://localhost:5000/api/profiles/${user.profile_id || user.id}/`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            setMessage('Profilo aggiornato con successo!');
            setLoading(false);

        } catch (err) {
            console.error("Errore salvataggio", err);
            setMessage('Errore durante il salvataggio.');
            setLoading(false);
        }
    };

    return (
        <div className="profile-container">
            <div className="profile-card">
                <h2>Modifica Profilo</h2>
                
                <form onSubmit={handleSubmit}>
                    
                    {/* SEZIONE AVATAR */}
                    <div className="avatar-wrapper">
                        {/* Immagine*/}
                        <img 
                            src={avatarPreview || "https://via.placeholder.com/150?text=No+Avatar"} 
                            alt="Avatar Profilo" 
                            className="avatar-image"
                        />
                        
                        {/* Bottone Edit (Matita) */}
                        <button type="button" className="avatar-edit-btn" onClick={triggerFileSelect}>
                            ✎
                        </button>

                        
                        <input 
                            type="file" 
                            id="file-input" 
                            ref={fileInputRef} 
                            onChange={handleImageChange} 
                            accept="image/*" // Accetta solo immagini
                        />
                    </div>

                    {/* SEZIONE NICKNAME */}
                    <div className="form-group">
                        <label>Nickname</label>
                        <input 
                            type="text" 
                            className="custom-input"
                            value={nickname}
                            onChange={(e) => setNickname(e.target.value)}
                            placeholder="Inserisci il tuo nome da battaglia"
                        />
                    </div>

                    {/* MESSAGGI E BOTTONE */}
                    {message && (
                        <div style={{
                            marginBottom: '15px', 
                            color: message.includes('Errore') ? '#ff4d4d' : '#00ff88'
                        }}>
                            {message}
                        </div>
                    )}

                    <button type="submit" className="btn-save" disabled={loading}>
                        {loading ? 'Salvataggio...' : 'SALVA MODIFICHE'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ProfilePage;