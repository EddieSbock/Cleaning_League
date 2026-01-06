import React, { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import './ProfileStyle.css';
import defaultavatar from '../../assets/avatardefault.jpg';

const ProfilePage = () => {
    // Stati per i dati
    const [profileId, setProfileId] = useState(null);
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
                
                const response = await api.get('profiles/'); 
                
                const myProfile = response.data[0]; 

                if (myProfile) {
                    setProfileId(myProfile.id); // Salviamo l'ID vero del profilo per dopo
                    setNickname(myProfile.nickname || '');
                    if (myProfile.avatar) {
                        const avatarPath = myProfile.avatar;

                        const fullAvatarUrl = avatarPath.startsWith('http') 
                            ? avatarPath 
                            : `http://127.0.0.1:8000${avatarPath}`;

                        setAvatarPreview(fullAvatarUrl);
                    }
                }
            } catch (err) {
                console.error("Errore caricamento profilo", err);
                setMessage("Impossibile caricare il profilo. Sei loggato?");
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

        if (!profileId) {
            setMessage("Errore: Profilo non trovato. Ricarica la pagina.");
            setLoading(false);
            return;
        }

        try {

            const formData = new FormData();
            formData.append('nickname', nickname);
            
            // Aggiungiamo l'immagine solo se l'utente ne ha caricata una nuova
            if (selectedFile) {
                formData.append('avatar', selectedFile);
            }

            //è necessario che l'interceptor non forzi application/json
            const response = await api.patch(`profiles/${profileId}/`, formData, {                
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });

            setMessage('Profilo aggiornato con successo!');

            const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({
                ...currentUser,
                nickname: response.data.nickname // Aggiorna il nome salvato
            }));

            setTimeout(() => {
                window.location.reload(); 
            }, 1000);

        } catch (err) {
            console.error("Errore salvataggio", err);
            setMessage('Errore durante il salvataggio.');
            setLoading(false);
        } finally {
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
                            src={avatarPreview || defaultavatar}
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
                            style={{display: 'none'}}
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
                            textAlign: 'center',
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