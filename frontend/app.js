document.addEventListener('DOMContentLoaded', () => {

    const API_URL = 'http://localhost:3000';

    const formulario = document.getElementById('formulario-solicitud');
    const listaSolicitudes = document.getElementById('lista-solicitudes');
    const notificationBadge = document.getElementById('notification-badge');
    const nitError = document.getElementById('nit-error');
    const userViewInput = document.getElementById('user-view-input');
    
    // Lógica de Pestañas
    const tabs = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(item => item.classList.remove('active'));
            tab.classList.add('active');
            const target = document.querySelector(tab.dataset.tab === 'crear' ? '#crear' : '#bandeja');
            tabContents.forEach(content => content.classList.remove('active'));
            target.classList.add('active');
        });
    });

    const obtenerYMostrarSolicitudes = async () => {
        const currentUser = userViewInput.value.trim();
        if (!currentUser) {
            listaSolicitudes.innerHTML = '<p>Ingresa tu usuario para ver tus solicitudes.</p>';
            notificationBadge.style.display = 'none';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/solicitudes`);
            const solicitudes = await response.json();
            listaSolicitudes.innerHTML = '';
            
            const misSolicitudes = solicitudes.filter(s => s.solicitante === currentUser || s.responsable === currentUser).reverse();
            const pendientesParaMi = misSolicitudes.filter(s => s.responsable === currentUser && s.estado === 'pendiente');
            
            notificationBadge.style.display = pendientesParaMi.length > 0 ? 'inline' : 'none';
            notificationBadge.textContent = pendientesParaMi.length;
            
            if (misSolicitudes.length === 0) {
                listaSolicitudes.innerHTML = `<p>No hay solicitudes en el historial para el usuario <b>${currentUser}</b>.</p>`;
                return;
            }

            misSolicitudes.forEach(solicitud => {
                const esMiTurnoDeAprobar = solicitud.responsable === currentUser && solicitud.estado === 'pendiente';
                
                const comentariosHtml = solicitud.comentarios.length > 0 ? 
                    `<div class="comment-history"><strong>Historial de Aprobación:</strong>${solicitud.comentarios.map(c => `<div class="comment">${c.fecha} - <b>${c.autor}</b>: ${c.texto}</div>`).join('')}</div>` : '';

                const tarjeta = document.createElement('div');
                tarjeta.className = `card solicitud-card status-${solicitud.estado}`;
                
                // Añadir todos los campos del formulario para un historial completo.
                tarjeta.innerHTML = `
                    <h3>${solicitud.titulo}</h3>
                    <p><strong>Estado:</strong> <span class="status status-${solicitud.estado}">${solicitud.estado}</span></p>
                    <hr>
                    <p><strong>Solicitante:</strong> ${solicitud.solicitante}</p>
                    <p><strong>Responsable:</strong> ${solicitud.responsable}</p>
                    <p><strong>Fecha de Creación:</strong> ${solicitud.fecha}</p>
                    <p><strong>Tipo de Solicitud:</strong> ${solicitud.tipo}</p>
                    <p><strong>NIT Cliente:</strong> ${solicitud.nit}</p>
                    <p><strong>Descripción:</strong> ${solicitud.descripcion || 'N/A'}</p>
                    
                    ${comentariosHtml}
                    
                    ${esMiTurnoDeAprobar ? `
                    <div class="solicitud-acciones">
                        <h4>Acciones Pendientes</h4>
                        <input type="text" id="comentario-${solicitud._id}" placeholder="Añadir Comentario (opcional)...">
                        <button class="btn btn-aprobar" data-id="${solicitud._id}">Aprobar</button>
                        <button class="btn btn-rechazar" data-id="${solicitud._id}">Rechazar</button>
                    </div>
                    ` : ''}
                `;

                listaSolicitudes.appendChild(tarjeta);
            });

        } catch (error) { console.error('Error al obtener solicitudes:', error); }
    };
    
    // Evento para el campo de filtro
    userViewInput.addEventListener('input', obtenerYMostrarSolicitudes);

    // Evento para el envío del formulario
    formulario.addEventListener('submit', async (event) => {
        event.preventDefault();
        nitError.style.display = 'none';
        const nuevaSolicitud = {
            titulo: document.getElementById('titulo').value,
            nit: document.getElementById('nit-cliente').value,
            tipo: document.getElementById('tipo-solicitud').value,
            descripcion: document.getElementById('descripcion').value,
            solicitante: document.getElementById('solicitante').value,
            responsable: document.getElementById('responsable').value,
        };
        try {
            const response = await fetch(`${API_URL}/solicitudes`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(nuevaSolicitud) });
            if (!response.ok) { const errorData = await response.json(); throw errorData; }
            formulario.reset();
            alert('¡Solicitud creada con éxito!');
            
            // Si el usuario que crea la solicitud está viendo su propia bandeja, la actualizamos
            if (userViewInput.value.trim() === nuevaSolicitud.solicitante) {
                obtenerYMostrarSolicitudes();
            }

        } catch (error) {
            console.error('Error al crear la solicitud:', error);
            if (error.code === 'nit_invalid') {
                nitError.textContent = 'El número de NIT no es correcto, verifíquelo o contactese con soporte técnico.';
                nitError.style.display = 'block';
            } else if (error.code === 'limit_exceeded') {
                alert('Error: Ya tienes 2 solicitudes pendientes. Deben ser aprobadas antes de crear una nueva.');
            } else {
                alert('Ocurrió un error inesperado al crear la solicitud.');
            }
        }
    });

    // Evento para aprobar o rechazar
    listaSolicitudes.addEventListener('click', async (event) => {
        const target = event.target;
        if (target.matches('.btn-aprobar') || target.matches('.btn-rechazar')) {
            const id = target.dataset.id;
            const nuevoEstado = target.matches('.btn-aprobar') ? 'aprobado' : 'rechazado';
            const comentario = document.getElementById(`comentario-${id}`).value;
            const currentUser = userViewInput.value.trim();
            if (!currentUser) { alert('Por favor, ingresa tu usuario en el campo de filtro para poder aprobar o rechazar.'); return; }
            await fetch(`${API_URL}/solicitudes/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ estado: nuevoEstado, comentario: comentario, currentUser: currentUser }) });
            obtenerYMostrarSolicitudes();
        }
    });
});