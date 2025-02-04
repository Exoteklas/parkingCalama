<?php

// Leer los datos JSON de la solicitud POST
$data = json_decode(file_get_contents('php://input'), true);

// Verificar si se recibió un dato válido
if (!$data) {
    echo 'No se recibieron datos válidos.';
    exit; // Detener ejecución si no se reciben datos válidos
}

// Ahora, los datos que llegaron pueden ser accedidos como un array
$codigoEmpresa = $data['codigoEmpresa'] ?? '89';
$tipoDocumento = $data['tipoDocumento'] ?? '39';
$total = $data['total'] ?? '0';
$detalleBoleta = $data['detalleBoleta'] ?? '';

// Mostrar los datos recibidos para ver si todo está bien
var_dump($data); // Elimina esto en producción
exit; // Elimina esta línea en producción, es solo para depuración

// Si todo está bien, continua con la solicitud cURL
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'https://qa.pullman.cl/srv-dte-web/rest/emisionDocumentoElectronico/generarDocumento',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => json_encode([
        "codigoEmpresa" => $codigoEmpresa,
        "tipoDocumento" => $tipoDocumento,
        "total" => $total,
        "detalleBoleta" => $detalleBoleta
    ]),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json'
    ],
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

if (curl_errno($curl)) {
    echo 'Error en la solicitud: ' . curl_error($curl);
} elseif ($httpCode !== 200) {
    echo "Error HTTP: Código $httpCode - Respuesta: $response";
} else {
    $responseData = json_decode($response, true);

    if (json_last_error() === JSON_ERROR_NONE) {
        if (isset($responseData['respuesta']) && $responseData['respuesta'] === 'OK') {
            echo "Boleta generada con éxito: " . $responseData['rutaAcepta'];
        } else {
            echo "Error en la generación de la boleta: " . ($responseData['respuesta'] ?? 'Respuesta desconocida');
        }
    } else {
        echo "Error al decodificar la respuesta JSON: " . json_last_error_msg();
    }
}

curl_close($curl);
?>
