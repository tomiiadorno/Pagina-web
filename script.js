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
    const btnCancelarPreReserva = document.getElementById('cancelarPreReserva'); // Nuevo botón

    const listaReservasUl = document.getElementById('listaReservas');

    // Configuración
    const precios = { 5: 20000, 8: 30000, 11: 40000 };
    const disponibilidadTotal = { 5: 2, 8: 2, 11: 1 };
    let reservas = [];
    let idReserva = 1;
    let reservaPendiente = null; // Almacena datos de la reserva actual (nueva o para editar)

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

    // Turnos: 15 a 23
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
            hoy.setHours(0, 0, 0, 0); // Medianoche de hoy
            const ahora = new Date(); // Fecha y hora actual

            const cargadas = JSON.parse(data);
            reservas = cargadas.filter(r => {
                const fechaReserva = new Date(r.dia + 'T' + r.hora + ':00:00'); // Asegurar que la hora se tome bien
                return fechaReserva >= ahora; // Solo reservas futuras o de hoy si la hora no pasó
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
        listaReservasUl.innerHTML = ""; // Limpiar lista

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

            // No se puede editar un turno fijo completo, solo una instancia.
            // O permitir editar solo si es el "original" de un turno fijo.
            if (reserva.esFijoOriginal) {
                // Podríamos permitir editar datos generales del turno fijo (equipo)
                // pero no la fecha/hora que afectaría a todos.
                // Por simplicidad, deshabilitamos la edición completa de turnos fijos.
                // Se pueden cancelar individualmente.
            }


            accionesDiv.appendChild(btnEditar);
            accionesDiv.appendChild(btnEliminar);

            li.appendChild(infoDiv);
            li.appendChild(accionesDiv);
            listaReservasUl.appendChild(li);
        });
    }

    function cargarReservaParaEditar(reserva) {
        // Solo se puede editar una reserva que no sea parte de un "turno fijo" generado automáticamente
        // O si es la reserva "original" que generó el turno fijo.
        // Por ahora, simplificamos: solo se pueden editar reservas no fijas o la primera de un fijo.
        if (reserva.esFijo && !reserva.esFijoOriginal && reservas.some(r => r.id !== reserva.id && r.equipo === reserva.equipo && r.esFijoOriginal)) {
            alert("Las instancias de un turno fijo recurrente no se pueden editar individualmente de esta forma. Cancele y cree una nueva si es necesario, o edite la reserva original del turno fijo (si aplica).");
            // Para una implementación más completa, se podría permitir cambiar la hora de *esta* instancia
            // o preguntar si se quieren cambiar todas las futuras. Es complejo.
            // Por ahora, no permitimos editar instancias secundarias de turnos fijos.
            // Permitiremos editar la "primera" si marcamos cuál es.
            // Mejor aún: no se puede editar un turno fijo, solo cancelarlo completo o instancias.
            // Si queremos editar, debe ser la reserva individual.
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
        esFijoCheckbox.checked = reserva.esFijoOriginal || reserva.esFijo; // Si es la original o una instancia
        esFijoCheckbox.disabled = reserva.esFijo && !reserva.esFijoOriginal; // No cambiar si es instancia

        // Guardamos la reserva que se está editando. Importante: pasar el ID.
        reservaPendiente = { ...reserva }; // Clonar para no modificar la original hasta confirmar

        confirmacionPagoDiv.style.display = "none";
        btnCalcularPrecio.textContent = "Actualizar Precio/Disponibilidad";
        actualizarOpcionesTipoCancha(); // Actualizar disponibilidad
    }

    function eliminarReserva(idReservaAEliminar) {
        const reservaAEliminar = reservas.find(r => r.id === idReservaAEliminar);
        if (!reservaAEliminar) return;

        let mensajeConfirmacion = `¿Seguro que deseas cancelar la reserva para "${reservaAEliminar.equipo}" el día ${new Date(reservaAEliminar.dia + 'T00:00:00').toLocaleDateString()} a las ${reservaAEliminar.hora}:00?`;

        // Si es una reserva que originó un turno fijo, advertir que se cancelarán todas las instancias futuras.
        if (reservaAEliminar.esFijoOriginal) {
            mensajeConfirmacion = `Esta es una reserva original de un turno fijo. Cancelarla eliminará TODAS las instancias futuras de este turno fijo para "${reservaAEliminar.equipo}". ¿Deseas continuar?`;
        }

        if (confirm(mensajeConfirmacion)) {
            if (reservaAEliminar.esFijoOriginal) {
                // Eliminar todas las reservas futuras asociadas a este turno fijo original
                const equipoOriginal = reservaAEliminar.equipo;
                const horaOriginal = reservaAEliminar.hora;
                const tipoOriginal = reservaAEliminar.tipo;

                reservas = reservas.filter(r =>
                    !(r.equipo === equipoOriginal && r.hora === horaOriginal && r.tipo === tipoOriginal && r.esFijo && new Date(r.dia) >= new Date(reservaAEliminar.dia))
                );
            } else {
                // Eliminar solo esta instancia
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
        const valorActual = tipoCanchaSelect.value; // Guardar valor actual para intentar restaurarlo

        tipoCanchaSelect.innerHTML = ""; // Limpiar opciones

        [5, 8, 11].forEach(tipo => {
            const disponibles = (dia && hora) ? canchasDisponibles(tipo, dia, hora) : disponibilidadTotal[tipo];
            const opcion = document.createElement('option');
            opcion.value = tipo;
            opcion.textContent = `Fútbol ${tipo} (Disponibles: ${disponibles})`;
            opcion.disabled = disponibles <= 0;
            tipoCanchaSelect.appendChild(opcion);
        });
        // Intentar restaurar la selección previa si aún es válida
        if (Array.from(tipoCanchaSelect.options).some(opt => opt.value === valorActual && !opt.disabled)) {
            tipoCanchaSelect.value = valorActual;
        } else {
            // Seleccionar la primera opción no deshabilitada si la anterior ya no es válida
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
        const fechaInicial = new Date(diaStr + 'T00:00:00'); // Asegurar que se tome la zona horaria local
        const fechas = [];
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        // Turno fijo por 1 mes (4 semanas es más predecible que "un mes")
        for (let i = 0; i < 4; i++) { // 4 semanas
            const nuevaFecha = new Date(fechaInicial);
            nuevaFecha.setDate(fechaInicial.getDate() + (i * 7));
            if (nuevaFecha >= hoy) { // Solo fechas futuras o hoy
                fechas.push(nuevaFecha.toISOString().split('T')[0]);
            }
        }
        return fechas;
    }

    // Configurar el atributo min para el input de fecha
    function setMinDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // Enero es 0
        const dd = String(today.getDate()).padStart(2, '0');
        diaReservaInput.min = `${yyyy}-${mm}-${dd}`;
    }

    // --- MANEJADORES DE EVENTOS DEL FORMULARIO ---
    diaReservaInput.addEventListener('change', actualizarOpcionesTipoCancha);
    horaTurnoSelect.addEventListener('change', actualizarOpcionesTipoCancha);
    tipoCanchaSelect.addEventListener('change', actualizarOpcionesTipoCancha); //Añadido para que se actualice si cambia el tipo también

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

        // Validar hora para el día de hoy
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
        let esTurnoFijoReal = esFijo; // Para saber si estamos generando múltiples reservas

        // Si es un turno fijo Y NO estamos editando una instancia de un turno fijo existente
        if (esFijo && (!reservaPendiente || !reservaPendiente.esFijo || reservaPendiente.dia !== dia)) {
            fechasReserva = obtenerFechasTurnoFijoDesde(dia);
            if (fechasReserva.length === 0) {
                alert("No hay fechas futuras disponibles para el turno fijo desde el día seleccionado.");
                return;
            }
            for (const fecha of fechasReserva) {
                // Si estamos editando y la fecha es la original, no la chequeamos contra sí misma
                let idExcluir = reservaPendiente ? reservaPendiente.id : null;
                if (!hayDisponibilidad(tipo, fecha, hora)) {
                    alert(`No hay disponibilidad para Fútbol ${tipo} el día ${new Date(fecha + 'T00:00:00').toLocaleDateString()} a las ${hora}:00 hs.`);
                    return;
                }
            }
        } else { // Reserva única o edición de una reserva (fija o no)
            esTurnoFijoReal = false; // No se generan múltiples reservas si es edición o no es fijo
            // Si es una edición, hay que permitir que la reserva actual "ocupe" su propio turno
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

        // Guardar datos para la confirmación final
        // Si es un turno fijo que genera múltiples fechas, esFijoOriginal se marca en la primera
        reservaPendiente = {
            id: reservaPendiente ? reservaPendiente.id : null, // Mantener ID si es edición
            equipo: nombre,
            tipo: tipo,
            fechas: fechasReserva, // Puede ser una o varias
            hora: hora,
            esFijo: esFijo, // Intención del usuario
            esFijoOriginal: esFijo && fechasReserva.length > 1 && fechasReserva[0] === dia, // Si esta es la que origina el turno fijo
            editando: !!(reservaPendiente && reservaPendiente.id) // Para saber si estamos en modo edición
        };
    });

    btnCancelarPreReserva.addEventListener('click', function () {
        confirmacionPagoDiv.style.display = "none";
        // No reseteamos el form, el usuario quiere modificar
        nombreEquipoInput.focus();
    });

    btnConfirmarReserva.addEventListener('click', function () {
        if (!reservaPendiente) return;

        if (reservaPendiente.editando) { // Modo edición
            const index = reservas.findIndex(r => r.id === reservaPendiente.id);
            if (index !== -1) {
                // Si se está editando una reserva que ERA parte de un turno fijo, y se desmarca "esFijo"
                // O si se cambia la fecha/hora/tipo de una que era "esFijoOriginal"
                // Esto implicaría lógica compleja para desvincularla o actualizar las demás.
                // Por simplicidad: si se edita una reserva y se cambian datos clave de un turno fijo,
                // se trata como una reserva individual nueva y la original (y sus asociadas si era esFijoOriginal) se deben cancelar aparte.
                // O, más simple aún: la edición solo cambia datos de ESA instancia.

                reservas[index].equipo = reservaPendiente.equipo;
                reservas[index].dia = reservaPendiente.fechas[0]; // Edición es siempre sobre una fecha
                reservas[index].tipo = reservaPendiente.tipo;
                reservas[index].hora = reservaPendiente.hora;
                // Si se está editando la "original" de un fijo y se desmarca "esFijo", las otras instancias deberían eliminarse.
                // Esta lógica puede ser muy compleja. Por ahora, la edición es "simple" y no afecta a otros turnos fijos asociados.
                // Si se desmarca "esFijo", esFijoOriginal se vuelve false.
                reservas[index].esFijo = reservaPendiente.esFijo;
                // esFijoOriginal no debería cambiar en edición simple a menos que se maneje la cancelación de las demás.
                // Si se desmarcó "esFijo" en la edición, ya no es "original" de nada.
                if (!reservas[index].esFijo) {
                    reservas[index].esFijoOriginal = false;
                }
                alert("Reserva actualizada con éxito.");
            }
        } else { // Modo crear
            reservaPendiente.fechas.forEach((fecha, index) => {
                reservas.push({
                    id: idReserva++,
                    equipo: reservaPendiente.equipo,
                    tipo: reservaPendiente.tipo,
                    dia: fecha,
                    hora: reservaPendiente.hora,
                    esFijo: reservaPendiente.esFijo, // La intención del usuario
                    // Marcar solo la primera reserva del lote como "original" si es un turno fijo
                    esFijoOriginal: reservaPendiente.esFijo && index === 0
                });
            });
            alert("Reserva(s) creada(s) con éxito.");
        }

        mostrarReservas();
        guardarReservasEnLocalStorage();
        actualizarOpcionesTipoCancha();

        // Resetear estado
        reservaPendiente = null;
        formReserva.reset();
        esFijoCheckbox.disabled = false;
        setMinDate(); // Restablecer fecha mínima
        btnCalcularPrecio.textContent = "Calcular Precio";
        confirmacionPagoDiv.style.display = "none";
        mostrarSeccion('reservas'); // Para asegurar que se vean los cambios en la lista
    });

    // --- INICIALIZACIÓN ---
    cargarHorasTurno();
    setMinDate();
    cargarReservasDesdeLocalStorage(); // Carga y muestra inicial
    actualizarOpcionesTipoCancha(); // Para estado inicial del select de canchas
    mostrarSeccion('inicio'); // Mostrar sección de inicio por defecto
});