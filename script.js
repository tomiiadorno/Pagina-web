document.addEventListener('DOMContentLoaded', function () {
    // Elementos del DOM para navegación
    const btnInicio = document.getElementById('btnInicio');
    const btnReservas = document.getElementById('btnReservas');
    const seccionInicio = document.getElementById('inicio');
    const seccionReservas = document.getElementById('reservas');

    // Elementos del DOM para el formulario y la lista
    const formReserva = document.getElementById('formReserva');
    const nombreEquipoInput = document.getElementById('nombreEquipo');
    const diaReservaInput = document.getElementById('diaReserva');
    const tipoCanchaSelect = document.getElementById('tipoCancha');
    const horaTurnoSelect = document.getElementById('horaTurno');
    const esFijoCheckbox = document.getElementById('esFijo');
    const btnCalcularPrecio = document.getElementById('calcularPrecio');

    const confirmacionPagoDiv = document.getElementById('confirmacionPago');
    const textoPrecioP = document.getElementById('textoPrecio');
    const btnConfirmarReserva = document.getElementById('confirmarReserva');
    const btnCancelarPreReserva = document.getElementById('cancelarPreReserva');

    const listaReservasUl = document.getElementById('listaReservas');

    const precios = { 5: 20000, 8: 30000, 11: 40000 };
    const disponibilidadTotal = { 5: 2, 8: 2, 11: 1 };
    let reservas = [];
    let idReserva = 1;
    let reservaPendiente = null;

    // --- NAVEGACIÓN ---
    function mostrarSeccion(seccionId) {
        seccionInicio.style.display = 'none';
        seccionReservas.style.display = 'none';
        btnInicio.classList.remove('active');
        btnReservas.classList.remove('active');

        if (seccionId === 'inicio') {
            seccionInicio.style.display = 'flex';
            btnInicio.classList.add('active');
        } else if (seccionId === 'reservas') {
            seccionReservas.style.display = 'flex';
            btnReservas.classList.add('active');
        }
    }

    btnInicio.addEventListener('click', () => mostrarSeccion('inicio'));
    btnReservas.addEventListener('click', () => mostrarSeccion('reservas'));

    // --- LÓGICA DE RESERVAS ---

    function cargarHorasTurno() {
        for (let hora = 15; hora <= 23; hora++) {
            const opcion = document.createElement('option');
            opcion.value = hora;
            opcion.textContent = `${hora}:00 hs`;
            horaTurnoSelect.appendChild(opcion);
        }
    }

    function guardarReservasEnLocalStorage() {
        localStorage.setItem('reservas', JSON.stringify(reservas));
    }

    function cargarReservasDesdeLocalStorage() {
        const data = localStorage.getItem('reservas');
        if (data) {
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0); 
            const ahora = new Date(); 
            const cargadas = JSON.parse(data);
            reservas = cargadas.filter(r => {
                const fechaReserva = new Date(r.dia + 'T' + r.hora + ':00:00');
                return fechaReserva >= ahora;
            });

            if (reservas.length > 0) {
                idReserva = Math.max(...reservas.map(r => r.id)) + 1;
            } else {
                idReserva = 1;
            }
            mostrarReservas();
        }
    }

    function mostrarReservas() {
        listaReservasUl.innerHTML = "";

        const reservasOrdenadas = [...reservas].sort((a, b) => {
            const fechaA = new Date(a.dia + 'T' + a.hora + ':00:00');
            const fechaB = new Date(b.dia + 'T' + b.hora + ':00:00');
            return fechaA - fechaB;
        });


        if (reservasOrdenadas.length === 0) {
            listaReservasUl.innerHTML = "<p style='text-align:center; color: #b2dfdb;'>Aún no tienes reservas activas.</p>";
            return;
        }

        reservasOrdenadas.forEach(reserva => {
            const li = document.createElement('li');

            const infoDiv = document.createElement('div');
            infoDiv.classList.add('reserva-info');
            infoDiv.innerHTML = `
                <strong>Equipo:</strong> ${reserva.equipo}<br>
                <strong>Cancha:</strong> Fútbol ${reserva.tipo} <br>
                <strong>Día:</strong> ${new Date(reserva.dia + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} <br>
                <strong>Hora:</strong> ${reserva.hora}:00 hs
                ${reserva.esFijoOriginal ? ' <span style="color: #00796b; font-weight:bold;">(Turno Fijo)</span>' : ''}
            `;

            const accionesDiv = document.createElement('div');
            accionesDiv.classList.add('reserva-acciones');

            const btnEditar = document.createElement('button');
            btnEditar.textContent = "Editar";
            btnEditar.classList.add('btn', 'btn-info');
            btnEditar.addEventListener('click', () => cargarReservaParaEditar(reserva));

            const btnEliminar = document.createElement('button');
            btnEliminar.textContent = "Cancelar";
            btnEliminar.classList.add('btn', 'btn-danger');
            btnEliminar.addEventListener('click', () => eliminarReserva(reserva.id));

            accionesDiv.appendChild(btnEditar);
            accionesDiv.appendChild(btnEliminar);

            li.appendChild(infoDiv);
            li.appendChild(accionesDiv);
            listaReservasUl.appendChild(li);
        });
    }

    function cargarReservaParaEditar(reserva) {
        if (reserva.esFijo && !reserva.esFijoOriginal && reservas.some(r => r.id !== reserva.id && r.equipo === reserva.equipo && r.esFijoOriginal)) {
            alert("Las instancias de un turno fijo recurrente no se pueden editar individualmente de esta forma. Cancele y cree una nueva si es necesario, o edite la reserva original del turno fijo (si aplica).");
            if (reserva.esFijo) {
                alert("Los turnos fijos no se pueden editar en su totalidad. Puede cancelar instancias individuales o el turno completo (cancelando cada una).");
                return;
            }
        }

        formReserva.scrollIntoView({ behavior: 'smooth' });
        nombreEquipoInput.value = reserva.equipo;
        diaReservaInput.value = reserva.dia;
        tipoCanchaSelect.value = reserva.tipo;
        horaTurnoSelect.value = reserva.hora;
        esFijoCheckbox.checked = reserva.esFijoOriginal || reserva.esFijo; 
        esFijoCheckbox.disabled = reserva.esFijo && !reserva.esFijoOriginal; 

        reservaPendiente = { ...reserva };

        confirmacionPagoDiv.style.display = "none";
        btnCalcularPrecio.textContent = "Actualizar Precio/Disponibilidad";
        actualizarOpcionesTipoCancha();
    }

    function eliminarReserva(idReservaAEliminar) {
        const reservaAEliminar = reservas.find(r => r.id === idReservaAEliminar);
        if (!reservaAEliminar) return;

        let mensajeConfirmacion = `¿Seguro que deseas cancelar la reserva para "${reservaAEliminar.equipo}" el día ${new Date(reservaAEliminar.dia + 'T00:00:00').toLocaleDateString()} a las ${reservaAEliminar.hora}:00?`;

        if (reservaAEliminar.esFijoOriginal) {
            mensajeConfirmacion = `Esta es una reserva original de un turno fijo. Cancelarla eliminará TODAS las instancias futuras de este turno fijo para "${reservaAEliminar.equipo}". ¿Deseas continuar?`;
        }

        if (confirm(mensajeConfirmacion)) {
            if (reservaAEliminar.esFijoOriginal) {
                const equipoOriginal = reservaAEliminar.equipo;
                const horaOriginal = reservaAEliminar.hora;
                const tipoOriginal = reservaAEliminar.tipo;

                reservas = reservas.filter(r =>
                    !(r.equipo === equipoOriginal && r.hora === horaOriginal && r.tipo === tipoOriginal && r.esFijo && new Date(r.dia) >= new Date(reservaAEliminar.dia))
                );
            } else {
                reservas = reservas.filter(r => r.id !== idReservaAEliminar);
            }

            mostrarReservas();
            actualizarOpcionesTipoCancha();
            guardarReservasEnLocalStorage();
            alert("Reserva(s) cancelada(s) exitosamente.");
        }
    }

    function canchasDisponibles(tipo, dia, hora) {
        const ocupadas = reservas.filter(r =>
            r.tipo == tipo && r.dia === dia && r.hora == hora && (!reservaPendiente || r.id !== reservaPendiente.id)
        ).length;
        return disponibilidadTotal[tipo] - ocupadas;
    }

    function actualizarOpcionesTipoCancha() {
        const dia = diaReservaInput.value;
        const hora = horaTurnoSelect.value;
        const valorActual = tipoCanchaSelect.value;

        tipoCanchaSelect.innerHTML = "";

        [5, 8, 11].forEach(tipo => {
            const disponibles = (dia && hora) ? canchasDisponibles(tipo, dia, hora) : disponibilidadTotal[tipo];
            const opcion = document.createElement('option');
            opcion.value = tipo;
            opcion.textContent = `Fútbol ${tipo} (Disponibles: ${disponibles})`;
            opcion.disabled = disponibles <= 0;
            tipoCanchaSelect.appendChild(opcion);
        });
        if (Array.from(tipoCanchaSelect.options).some(opt => opt.value === valorActual && !opt.disabled)) {
            tipoCanchaSelect.value = valorActual;
        } else {
            const primeraOpcionValida = Array.from(tipoCanchaSelect.options).find(opt => !opt.disabled);
            if (primeraOpcionValida) {
                tipoCanchaSelect.value = primeraOpcionValida.value;
            }
        }
    }

    function hayDisponibilidad(tipo, dia, hora) {
        return canchasDisponibles(tipo, dia, hora) > 0;
    }

    function obtenerFechasTurnoFijoDesde(diaStr) {
        const fechaInicial = new Date(diaStr + 'T00:00:00');
        const fechas = [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        for (let i = 0; i < 4; i++) { 
            const nuevaFecha = new Date(fechaInicial);
            nuevaFecha.setDate(fechaInicial.getDate() + (i * 7));
            if (nuevaFecha >= hoy) {
                fechas.push(nuevaFecha.toISOString().split('T')[0]);
            }
        }
        return fechas;
    }

    function setMinDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); 
        const dd = String(today.getDate()).padStart(2, '0');
        diaReservaInput.min = `${yyyy}-${mm}-${dd}`;
    }

    diaReservaInput.addEventListener('change', actualizarOpcionesTipoCancha);
    horaTurnoSelect.addEventListener('change', actualizarOpcionesTipoCancha);
    tipoCanchaSelect.addEventListener('change', actualizarOpcionesTipoCancha); 

    btnCalcularPrecio.addEventListener('click', function () {
        const nombre = nombreEquipoInput.value.trim();
        const dia = diaReservaInput.value;
        const tipo = tipoCanchaSelect.value;
        const hora = horaTurnoSelect.value;
        const esFijo = esFijoCheckbox.checked;

        if (!nombre || !dia || !tipo || !hora) {
            alert("Por favor, complete todos los campos del formulario.");
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaElegida = new Date(dia + 'T00:00:00');
        if (fechaElegida < hoy) {
            alert("No se puede reservar para una fecha pasada.");
            diaReservaInput.focus();
            return;
        }

        if (fechaElegida.toDateString() === hoy.toDateString()) {
            const horaActual = new Date().getHours();
            if (parseInt(hora) <= horaActual) {
                alert("Para el día de hoy, solo puedes reservar turnos futuros.");
                horaTurnoSelect.focus();
                return;
            }
        }


        const precioUnitario = precios[tipo];
        let fechasReserva = [dia];
        let esTurnoFijoReal = esFijo; 
        if (esFijo && (!reservaPendiente || !reservaPendiente.esFijo || reservaPendiente.dia !== dia)) {
            fechasReserva = obtenerFechasTurnoFijoDesde(dia);
            if (fechasReserva.length === 0) {
                alert("No hay fechas futuras disponibles para el turno fijo desde el día seleccionado.");
                return;
            }
            for (const fecha of fechasReserva) {
                let idExcluir = reservaPendiente ? reservaPendiente.id : null;
                if (!hayDisponibilidad(tipo, fecha, hora)) {
                    alert(`No hay disponibilidad para Fútbol ${tipo} el día ${new Date(fecha + 'T00:00:00').toLocaleDateString()} a las ${hora}:00 hs.`);
                    return;
                }
            }
        } else { 
            esTurnoFijoReal = false;
            if (!hayDisponibilidad(tipo, dia, hora)) {
                alert(`No hay disponibilidad para Fútbol ${tipo} el día ${new Date(dia + 'T00:00:00').toLocaleDateString()} a las ${hora}:00 hs.`);
                return;
            }
        }

        const total = precioUnitario * (reservaPendiente && !esFijo ? 1 : fechasReserva.length);

        let ulFechasHtml = "<ul>";
        fechasReserva.forEach(f => {
            ulFechasHtml += `<li>${new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}</li>`;
        });
        ulFechasHtml += "</ul>";

        textoPrecioP.innerHTML = `
            <p><strong>Equipo:</strong> ${nombre}</p>
            <p><strong>Cancha:</strong> Fútbol ${tipo}</p>
            <p><strong>Hora:</strong> ${hora}:00 hs</p>
            <p><strong>${(esFijo && fechasReserva.length > 1) ? 'Turno Fijo Semanal (4 semanas)' : 'Turno Único'}</strong></p>
            <p><strong>Precio por turno:</strong> $${precioUnitario.toLocaleString()}</p>
            <p><strong>Cantidad de turnos:</strong> ${fechasReserva.length}</p>
            <p><strong>TOTAL A PAGAR: $${total.toLocaleString()}</strong></p>
            <p><strong>Día(s):</strong></p>
            ${ulFechasHtml}
        `;

        confirmacionPagoDiv.style.display = "block";
        confirmacionPagoDiv.scrollIntoView({ behavior: 'smooth' });

        reservaPendiente = {
            id: reservaPendiente ? reservaPendiente.id : null, 
            equipo: nombre,
            tipo: tipo,
            fechas: fechasReserva,
            hora: hora,
            esFijo: esFijo,
            esFijoOriginal: esFijo && fechasReserva.length > 1 && fechasReserva[0] === dia, 
            editando: !!(reservaPendiente && reservaPendiente.id) 
        };
    });

    btnCancelarPreReserva.addEventListener('click', function () {
        confirmacionPagoDiv.style.display = "none";
        nombreEquipoInput.focus();
    });

    btnConfirmarReserva.addEventListener('click', function () {
        if (!reservaPendiente) return;

        if (reservaPendiente.editando) { // Modo edición
            const index = reservas.findIndex(r => r.id === reservaPendiente.id);
            if (index !== -1) {
                reservas[index].equipo = reservaPendiente.equipo;
                reservas[index].dia = reservaPendiente.fechas[0];
                reservas[index].tipo = reservaPendiente.tipo;
                reservas[index].hora = reservaPendiente.hora;
                reservas[index].esFijo = reservaPendiente.esFijo;
                if (!reservas[index].esFijo) {
                    reservas[index].esFijoOriginal = false;
                }
                alert("Reserva actualizada con éxito.");
            }
        } else { 
            reservaPendiente.fechas.forEach((fecha, index) => {
                reservas.push({
                    id: idReserva++,
                    equipo: reservaPendiente.equipo,
                    tipo: reservaPendiente.tipo,
                    dia: fecha,
                    hora: reservaPendiente.hora,
                    esFijo: reservaPendiente.esFijo, 
                    esFijoOriginal: reservaPendiente.esFijo && index === 0
                });
            });
            alert("Reserva(s) creada(s) con éxito.");
        }

        mostrarReservas();
        guardarReservasEnLocalStorage();
        actualizarOpcionesTipoCancha();

        reservaPendiente = null;
        formReserva.reset();
        esFijoCheckbox.disabled = false;
        setMinDate(); 
        btnCalcularPrecio.textContent = "Calcular Precio";
        confirmacionPagoDiv.style.display = "none";
        mostrarSeccion('reservas');
    });

    cargarHorasTurno();
    setMinDate();
    cargarReservasDesdeLocalStorage();
    actualizarOpcionesTipoCancha();
    mostrarSeccion('inicio'); 
});