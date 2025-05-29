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

const precios = {
    5: 20000,
    8: 30000,
    11: 40000
};

const disponibilidadTotal = {
    5: 2,
    8: 2,
    11: 1
};

const reservas = [];
let idReserva = 1;
let reservaPendiente = null;

// Guardar en localStorage
function guardarReservasEnLocalStorage() {
    localStorage.setItem('reservas', JSON.stringify(reservas));
}

// Cargar reservas y filtrar pasadas
function cargarReservasDesdeLocalStorage() {
    const data = localStorage.getItem('reservas');
    if (data) {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const ahora = new Date();

        const cargadas = JSON.parse(data);
        for (let i = 0; i < cargadas.length; i++) {
            const r = cargadas[i];
            const fecha = new Date(r.dia);
            if (
                fecha > hoy ||
                (fecha.toDateString() === hoy.toDateString() && r.hora > ahora.getHours())
            ) {
                reservas.push(r);
            }
        }

        if (reservas.length > 0) {
            let maxId = reservas[0].id;
            for (let i = 1; i < reservas.length; i++) {
                if (reservas[i].id > maxId) {
                    maxId = reservas[i].id;
                }
            }
            idReserva = maxId + 1;
        } else {
            idReserva = 1;
        }

        mostrarReservas();
    }
}

function mostrarReservas() {
    const lista = document.getElementById('listaReservas');
    lista.innerHTML = "";

    for (let i = 0; i < reservas.length; i++) {
        const reserva = reservas[i];
        const li = document.createElement('li');
        li.innerText = `Equipo: ${reserva.equipo} | Cancha: Fútbol ${reserva.tipo} | Día: ${reserva.dia} | Hora: ${reserva.hora}:00`;

        const btnEliminar = document.createElement('button');
        btnEliminar.innerText = "Cancelar";
        btnEliminar.addEventListener('click', function () {
            reservas.splice(i, 1);
            mostrarReservas();
            actualizarOpcionesTipoCancha();
            guardarReservasEnLocalStorage();
        });

        li.appendChild(btnEliminar);
        lista.appendChild(li);
    }
}

function canchasDisponibles(tipo, dia, hora) {
    let ocupadas = 0;
    for (let i = 0; i < reservas.length; i++) {
        const r = reservas[i];
        if (r.tipo == tipo && r.dia === dia && r.hora == hora) {
            ocupadas++;
        }
    }
    return disponibilidadTotal[tipo] - ocupadas;
}

function actualizarOpcionesTipoCancha() {
    const select = document.getElementById('tipoCancha');
    const dia = document.getElementById('diaReserva').value;
    const hora = document.getElementById('horaTurno').value;

    select.innerHTML = "";

    const tipos = [5, 8, 11];
    for (let i = 0; i < tipos.length; i++) {
        const tipo = tipos[i];
        const disponibles = (dia && hora) ? canchasDisponibles(tipo, dia, hora) : disponibilidadTotal[tipo];
        const opcion = document.createElement('option');
        opcion.value = tipo;
        opcion.textContent = `Fútbol ${tipo} (${disponibles})`;
        opcion.disabled = disponibles <= 0;
        select.appendChild(opcion);
    }
}

function hayDisponibilidad(tipo, dia, hora) {
    return canchasDisponibles(tipo, dia, hora) > 0;
}

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

// DOM loaded
document.addEventListener('DOMContentLoaded', function () {
    cargarHorasTurno();
    cargarReservasDesdeLocalStorage();
    actualizarOpcionesTipoCancha();

    const diaInput = document.getElementById('diaReserva');
    const horaInput = document.getElementById('horaTurno');

    diaInput.addEventListener('change', actualizarOpcionesTipoCancha);
    horaInput.addEventListener('change', actualizarOpcionesTipoCancha);

    const btnCalcular = document.getElementById('calcularPrecio');
    const btnConfirmar = document.getElementById('confirmarReserva');

    btnCalcular.addEventListener('click', function () {
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
            for (let i = 0; i < fechasReserva.length; i++) {
                if (!hayDisponibilidad(tipo, fechasReserva[i], hora)) {
                    alert("No hay disponibilidad para al menos una de las fechas del turno fijo.");
                    return;
                }
            }
        } else {
            if (!hayDisponibilidad(tipo, dia, hora)) {
                alert("No hay disponibilidad para ese turno.");
                return;
            }
        }

        const total = precio * fechasReserva.length;
        const textoPrecio = document.getElementById('textoPrecio');

        let ul = "<ul>";
        for (let i = 0; i < fechasReserva.length; i++) {
            ul += "<li>" + fechasReserva[i] + "</li>";
        }
        ul += "</ul>";

        textoPrecio.innerHTML = `
            <p>Total a pagar: $${total} (${fechasReserva.length} turno/s)</p>
            <p>Días:</p>
            ${ul}
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

    btnConfirmar.addEventListener('click', function () {
        if (reservaPendiente) {
            const equipo = reservaPendiente.equipo;
            const tipo = reservaPendiente.tipo;
            const fechas = reservaPendiente.fechas;
            const hora = reservaPendiente.hora;
            const esFijo = reservaPendiente.esFijo;

            for (let i = 0; i < fechas.length; i++) {
                reservas.push({
                    id: idReserva++,
                    equipo: equipo,
                    tipo: tipo,
                    dia: fechas[i],
                    hora: hora,
                    esFijo: esFijo
                });
            }

            mostrarReservas();
            guardarReservasEnLocalStorage();

            reservaPendiente = null;
            document.getElementById('formReserva').reset();
            document.getElementById('confirmacionPago').style.display = "none";
            actualizarOpcionesTipoCancha();
        }
    });
});
