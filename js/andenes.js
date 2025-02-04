async function calcAndenes() {
    const input = document.getElementById('andenQRPat').value;
    const cont = document.getElementById('contAnden');
    const dest = document.getElementById('destinoBuses');

    if (!(dest.value > 0)) {
        alert('Seleccione Empresa y Destino');
        return;
    }

    if (!patRegEx.test(input)) {
        console.log('No es patente, leer QR');
        return;
    }

    try {
        const data = await getMovByPatente(input);

        if (!data) {
            alert('Patente no encontrada');
            return;
        }

        if (data['tipo'] === 'Anden') {
            if (data['fechasal'] === "0000-00-00") {
                cont.textContent = '';
                const date = new Date();
                const fechaent = new Date(`${data['fechaent']}T${data['horaent']}`);
                const diferencia = (date.getTime() - fechaent.getTime()) / 1000;
                const minutos = Math.ceil((diferencia / 60) / 25);

                const [elemPat, fechaPat, horaentPat, horasalPat, tiempPat, valPat, empPat] =
                    ['h1', 'h3', 'h3', 'h3', 'h3', 'h3', 'h4'].map(tag => document.createElement(tag));

                const ret = await getWLByPatente(data['patente']);
                const destInfo = await getDestByID(dest.value);

                let valorTot = minutos * destInfo['valor'];
                if (ret !== null) {
                    valorTot = 0;
                }

                elemPat.textContent = `Patente: ${data['patente']}`;
                empPat.textContent = `Empresa: ${data['empresa']}`;
                fechaPat.textContent = `Fecha: ${data['fechaent']}`;
                horaentPat.textContent = `Hora Ingreso: ${data['horaent']}`;
                horasalPat.textContent = `Hora salida: ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
                tiempPat.textContent = `Tiempo de Parking: ${minutos * 25} min.`;
                valPat.textContent = `Valor: $${valorTot}`;

                cont.append(elemPat, empPat, fechaPat, horaentPat, horasalPat, tiempPat, valPat);

                // Ahora asignamos el evento al botón "Imprimir boleta"
                const impBtn = document.getElementById('impAnden');
                impBtn.onclick = function() {
                    impAnden(valorTot);
                };

            } else {
                alert('Esta patente ya fue cobrada');
            }
        } else {
            parking();
            document.getElementById('parkingQRPat').value = input;
        }
    } catch (error) {
        console.error('Error en calcAndenes:', error.message);
        alert('Ocurrió un error al calcular los andenes. Por favor, intente nuevamente.');
    }
}


async function listarAndenesEmpresas() {
    try {
        const data = await andGetEmpresas();
        if (data) {
            const lista = document.getElementById('empresaBuses');
            lista.textContent = '';
            let nullData = document.createElement('option');
            nullData.value = 0;
            nullData.textContent = 'Seleccione Empresa';
            lista.appendChild(nullData);
            data.forEach(itm => {
                let optData = document.createElement('option');
                optData.value = itm['idemp'];
                optData.textContent = itm['nombre'];
                lista.appendChild(optData);
            });
        }
    } catch (error) {
        console.error('Error al listar empresas:', error);
        alert('Ocurrió un error al cargar las empresas.');
    }
}

async function listarAndenesDestinos() {
    try {
        const data = await andGetDestinos();
        if (data) {
            const lista = document.getElementById('destinoBuses');
            lista.textContent = '';
            let nullData = document.createElement('option');
            nullData.value = 0;
            nullData.textContent = 'Seleccione Destino';
            lista.appendChild(nullData);
            data.forEach(itm => {
                let optData = document.createElement('option');
                optData.value = itm['iddest'];
                optData.textContent = `${itm['ciudad']} ($${itm['valor']})`;
                lista.appendChild(optData);
            });
        }
    } catch (error) {
        console.error('Error al listar destinos:', error);
        alert('Ocurrió un error al cargar los destinos.');
    }
}

async function andGetEmpresas() {
    if (getCookie('jwt')) {
        try {
            const response = await fetch(baseURL + "/empresas/get.php", {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${getCookie('jwt')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.log('Error al obtener empresas:', error);
            alert('No se pudo obtener la lista de empresas. Intente nuevamente.');
        }
    }
}

async function andGetDestinos() {
    if (getCookie('jwt')) {
        try {
            const response = await fetch(apiDestinos, {
                method: 'GET',
                mode: 'cors',
                headers: {
                    'Authorization': `Bearer ${getCookie('jwt')}`
                }
            });
            return await response.json();
        } catch (error) {
            console.log('Error al obtener destinos:', error);
            alert('No se pudo obtener la lista de destinos. Intente nuevamente.');
        }
    }
}

async function impAnden(valorTot) {
    const detalleBoleta = `53-${valorTot}-1-dsa-BANO`;

    try {
        const response = await fetch('php/boletas/generarBoleta.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            //Aqui se muestran los valores que seran enviados a la boleta
            body: JSON.stringify({
                codigoEmpresa: "89",
                tipoDocumento: "39",
                total: valorTot.toString(),
                detalleBoleta: detalleBoleta
            })
        });

        // Verificar si la respuesta fue exitosa
        if (response.ok) {
            // Generar el nombre de archivo
            const blob = await response.blob();
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = 'boleta.pdf'; // Nombre del archivo a descargar
            link.click(); // Forzar la descarga
        } else {
            alert('Error al generar la boleta: ' + response.statusText);
        }
    } catch (error) {
        console.error('Error al generar la boleta:', error);
        alert('Ocurrió un error al intentar generar la boleta.');
    }
}
