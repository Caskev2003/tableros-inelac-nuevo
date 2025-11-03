-- CreateTable
CREATE TABLE `usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NULL,
    `correo` VARCHAR(191) NOT NULL,
    `imagen` VARCHAR(191) NULL,
    `rol` ENUM('ADMINISTRADOR', 'SUPERVISOR_REFACCIONES', 'SUPERVISOR_QUIMICOS', 'DESPACHADOR') NOT NULL,
    `telefono` VARCHAR(191) NULL,
    `password` VARCHAR(191) NOT NULL,
    `emailVerified` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `usuario_correo_key`(`correo`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `refacciones_l3` (
    `codigo` INTEGER NOT NULL,
    `descripcion` VARCHAR(80) NOT NULL,
    `noParte` VARCHAR(50) NOT NULL,
    `existenciaFisica` INTEGER NOT NULL,
    `existenciaSistema` INTEGER NOT NULL,
    `diferencias` INTEGER NOT NULL,
    `proveedores` VARCHAR(80) NOT NULL,
    `cantidadEntrada` INTEGER NULL,
    `cantidadSalida` INTEGER NULL,
    `cantidad` INTEGER NULL,
    `fechaIngreso` DATETIME(3) NOT NULL,
    `movimiento` ENUM('ENTRADA', 'SALIDA', 'NUEVO_INGRESO', 'EDITADO', 'ELIMINADO') NOT NULL,
    `unidadMedidaId` ENUM('KG', 'LTS', 'PZ', 'MTS') NOT NULL,
    `ubicacionId` INTEGER NOT NULL,
    `reportadoPorId` INTEGER NOT NULL,

    INDEX `refacciones_l3_reportadoPorId_fkey`(`reportadoPorId`),
    INDEX `refacciones_l3_ubicacionId_fkey`(`ubicacionId`),
    PRIMARY KEY (`codigo`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `historial_movimientos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigoRefaccion` INTEGER NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `noParte` VARCHAR(191) NOT NULL,
    `movimiento` ENUM('ENTRADA', 'SALIDA', 'NUEVO_INGRESO', 'EDITADO', 'ELIMINADO') NOT NULL,
    `cantidad` INTEGER NOT NULL,
    `existenciaFisicaDespues` INTEGER NOT NULL,
    `reportadoPorId` INTEGER NOT NULL,
    `fechaMovimiento` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `historial_movimientos_reportadoPorId_fkey`(`reportadoPorId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ubicacion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `rack` INTEGER NOT NULL,
    `posicion` VARCHAR(20) NOT NULL,
    `fila` VARCHAR(20) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notificacion_refaccion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` INTEGER NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `creadaEn` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quimicos` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `codigo` INTEGER NOT NULL,
    `descripcion` VARCHAR(80) NOT NULL,
    `noLote` VARCHAR(50) NOT NULL,
    `existenciaFisica` INTEGER NOT NULL,
    `existenciaSistema` INTEGER NOT NULL,
    `diferencias` INTEGER NOT NULL,
    `proveedores` VARCHAR(80) NOT NULL,
    `cantidadEntrada` INTEGER NULL,
    `cantidadSalida` INTEGER NULL,
    `cantidad` INTEGER NULL,
    `fechaIngreso` DATETIME(3) NOT NULL,
    `fechaVencimiento` DATETIME(3) NOT NULL,
    `diasDeVida` INTEGER NULL,
    `retenidos` INTEGER NOT NULL,
    `productoLiberado` VARCHAR(191) NOT NULL,
    `movimiento` ENUM('ENTRADA', 'SALIDA', 'NUEVO_INGRESO', 'EDITADO', 'ELIMINADO') NOT NULL,
    `unidadMedidaId` ENUM('KG', 'LTS', 'PZ', 'MTS') NOT NULL,
    `ubicacionId` INTEGER NOT NULL,
    `reportadoPorId` INTEGER NOT NULL,

    INDEX `quimicos_reportadoPorId_fkey`(`reportadoPorId`),
    INDEX `quimicos_ubicacionId_fkey`(`ubicacionId`),
    UNIQUE INDEX `quimicos_codigo_noLote_key`(`codigo`, `noLote`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `refacciones_l3` ADD CONSTRAINT `refacciones_l3_ubicacionId_fkey` FOREIGN KEY (`ubicacionId`) REFERENCES `ubicacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `refacciones_l3` ADD CONSTRAINT `refacciones_l3_reportadoPorId_fkey` FOREIGN KEY (`reportadoPorId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `historial_movimientos` ADD CONSTRAINT `historial_movimientos_reportadoPorId_fkey` FOREIGN KEY (`reportadoPorId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quimicos` ADD CONSTRAINT `quimicos_ubicacionId_fkey` FOREIGN KEY (`ubicacionId`) REFERENCES `ubicacion`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quimicos` ADD CONSTRAINT `quimicos_reportadoPorId_fkey` FOREIGN KEY (`reportadoPorId`) REFERENCES `usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

