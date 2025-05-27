function mostrarSeccion(seccion) {
    document.getElementById('inicio').style.display = seccion === 'inicio' ? 'block' : 'none';
    document.getElementById('reservas').style.display = seccion === 'reservas' ? 'block' : 'none';
    }

// Turnos: 15 a 23
function cargarHorasTurno() {
    const selectHoras = document.getElementById('horaTurno');
    for (let hora = 15; hora <= 23; hora++) {
        const opcion = document.createElement('option');
        opcion.value = hora;
        opcion.textContent = `${hora}:00`;
        selectHoras.appendChild(opcion);
    }
}

// Estructura de precios
const precios = {
    5: 20000,
    8: 30000,
    11: 40000
};

// Cantidad total de canchas por tipo
const disponibilidadTotal = {
    5: 2,
    8: 2,
    11: 1
};

// Array de reservas
const reservas = []; // { id, equipo, tipo, dia, hora, esFijo }
let idReserva = 1;
let reservaPendiente = null;

// Mostrar reservas en la lista
function mostrarReservas() {
    const lista = document.getElementById('listaReservas');
    lista.innerHTML = "";

    reservas.forEach(reserva => {
        const li = document.createElement('li');
        li.innerText = `Equipo: ${reserva.equipo} | Cancha: Fútbol ${reserva.tipo} | Día: ${reserva.dia} | Hora: ${reserva.hora}:00`;

        const btnEliminar = document.createElement('button');
        btnEliminar.innerText = "Cancelar";
        btnEliminar.addEventListener('click', () => {
            const index = reservas.findIndex(r => r.id === reserva.id);
            reservas.splice(index, 1);
            mostrarReservas();
            actualizarOpcionesTipoCancha();
        });

        li.appendChild(btnEliminar);
        lista.appendChild(li);
    });
}

// Calcular cuántas canchas disponibles quedan
function canchasDisponibles(tipo, dia, hora) {
    const ocupadas = reservas.filter(r => r.tipo == tipo && r.dia === dia && r.hora == hora);
    return disponibilidadTotal[tipo] - ocupadas.length;
}

// Actualizar opciones de tipo de cancha mostrando cuántas quedan
function actualizarOpcionesTipoCancha() {
    const select = document.getElementById('tipoCancha');
    const dia = document.getElementById('diaReserva').value;
    const hora = document.getElementById('horaTurno').value;

    select.innerHTML = "";

    [5, 8, 11].forEach(tipo => {
        const disponibles = (dia && hora) ? canchasDisponibles(tipo, dia, hora) : disponibilidadTotal[tipo];
        const opcion = document.createElement('option');
        opcion.value = tipo;
        opcion.textContent = `Fútbol ${tipo} (${disponibles})`;
        opcion.disabled = disponibles <= 0;
        select.appendChild(opcion);
    });
}

// Verificar si hay lugar para una cancha
function hayDisponibilidad(tipo, dia, hora) {
    return canchasDisponibles(tipo, dia, hora) > 0;
}

// Obtener fechas del turno fijo desde la fecha seleccionada, hasta un mes después
function obtenerFechasTurnoFijoDesde(diaStr) {
    const fechaInicial = new Date(diaStr);
    const diaSemana = fechaInicial.getDay();
    const fechas = [];

    const fechaFin = new Date(fechaInicial);
    fechaFin.setMonth(fechaInicial.getMonth() + 1);

    const f = new Date(fechaInicial);
    while (f <= fechaFin) {
        if (f.getDay() === diaSemana && f >= fechaInicial) {
            fechas.push(f.toISOString().split('T')[0]);
        }
        f.setDate(f.getDate() + 1);
    }

    return fechas;
}

// DOM Loaded
document.addEventListener('DOMContentLoaded', () => {
    cargarHorasTurno();
    actualizarOpcionesTipoCancha();

    const diaInput = document.getElementById('diaReserva');
    const horaInput = document.getElementById('horaTurno');

    diaInput.addEventListener('change', actualizarOpcionesTipoCancha);
    horaInput.addEventListener('change', actualizarOpcionesTipoCancha);

    const btnCalcular = document.getElementById('calcularPrecio');
    const btnConfirmar = document.getElementById('confirmarReserva');

    btnCalcular.addEventListener('click', () => {
        const nombre = document.getElementById('nombreEquipo').value.trim();
        const dia = document.getElementById('diaReserva').value;
        const tipo = document.getElementById('tipoCancha').value;
        const hora = document.getElementById('horaTurno').value;
        const esFijo = document.getElementById('esFijo').checked;

        if (nombre === "" || dia === "" || !tipo || !hora) {
            alert("Completá todos los campos.");
            return;
        }

        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaElegida = new Date(dia);
        if (fechaElegida < hoy) {
            alert("No se puede reservar para una fecha pasada.");
            return;
        }

        const precio = precios[tipo];
        let fechasReserva = [dia];

        if (esFijo) {
            fechasReserva = obtenerFechasTurnoFijoDesde(dia);
            const noDisponibles = fechasReserva.filter(f => !hayDisponibilidad(tipo, f, hora));
            if (noDisponibles.length > 0) {
                alert("No hay disponibilidad para al menos una de las fechas del turno fijo.");
                return;
            }
        } else {
            if (!hayDisponibilidad(tipo, dia, hora)) {
                alert("No hay disponibilidad para ese turno.");
                return;
            }
        }

        const total = precio * fechasReserva.length;
        const textoPrecio = document.getElementById('textoPrecio');

        // Mostrar lista de días con viñetas
        textoPrecio.innerHTML = `
            <p>Total a pagar: $${total} (${fechasReserva.length} turno/s)</p>
            <p>Días:</p>
            <ul>${fechasReserva.map(f => `<li>${f}</li>`).join('')}</ul>
        `;

        document.getElementById('confirmacionPago').style.display = "block";

        reservaPendiente = {
            id: idReserva,
            equipo: nombre,
            tipo: tipo,
            fechas: fechasReserva,
            hora: hora,
            esFijo: esFijo
        };
    });

    btnConfirmar.addEventListener('click', () => {
        if (reservaPendiente) {
            const { equipo, tipo, fechas, hora, esFijo } = reservaPendiente;

            fechas.forEach(fecha => {
                reservas.push({
                    id: idReserva++,
                    equipo,
                    tipo,
                    dia: fecha,
                    hora,
                    esFijo
                });
            });

            mostrarReservas();
            reservaPendiente = null;

            document.getElementById('formReserva').reset();
            document.getElementById('confirmacionPago').style.display = "none";
            actualizarOpcionesTipoCancha();
        }
    });
});
